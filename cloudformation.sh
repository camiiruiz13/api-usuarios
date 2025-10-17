#!/bin/bash
set -e

# === Configuracion base ===
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

STACK_NAME="api-usuarios-stack"
BUCKET_NAME="api-users-bucket-anavargasdev"
ZIP_FILE="api-usuarios.zip"
TEMPLATE_FILE="template.yml"
REGION="us-east-1"

# === Nombres dinámicos de recursos ===
DYNAMO_TABLE_NAME="cld_api_usuarios-${STACK_NAME}-${REGION}"
QUEUE_NAME="api-usuarios-created-queue-${STACK_NAME}-${REGION}"

# === Instalacion y limpieza de dependencias ===
echo "=== Instalando dependencias ==="
rm -rf node_modules package-lock.json "$ZIP_FILE"
npm install
npm install @aws-sdk/client-sns

# === Normalizacion UTF-8 ===
echo "=== Normalizando codificacion del template (UTF-8 sin BOM) ==="
if [ -f "$TEMPLATE_FILE" ]; then
  if command -v iconv >/dev/null 2>&1; then
    iconv -f UTF-8 -t UTF-8 "$TEMPLATE_FILE" > clean_template.yml && mv -f clean_template.yml "$TEMPLATE_FILE"
  fi
  if command -v dos2unix >/dev/null 2>&1; then
    dos2unix "$TEMPLATE_FILE" >/dev/null 2>&1 || true
  else
    tr -d '
' < "$TEMPLATE_FILE" > "${TEMPLATE_FILE}.unix" && mv -f "${TEMPLATE_FILE}.unix" "$TEMPLATE_FILE"
  fi
else
  echo "Error: No se encontro el archivo $TEMPLATE_FILE"
  exit 1
fi

# === Validacion de bucket S3 ===
echo "=== Verificando bucket S3 '$BUCKET_NAME' ==="
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "Bucket existente."
else
  echo "Creando bucket S3..."
  aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
fi

# === Empaquetado del proyecto ===
echo "=== Empaquetando proyecto ==="
zip -r "$ZIP_FILE" index.js src node_modules package.json package-lock.json >/dev/null

# === Subida del artefacto a S3 ===
echo "=== Subiendo artefacto a S3 ==="
aws s3 cp "$ZIP_FILE" "s3://$BUCKET_NAME/$ZIP_FILE" >/dev/null

# === Subida y validacion del template CloudFormation ===
echo "=== Subiendo template a S3 para validacion ==="
aws s3 cp "$TEMPLATE_FILE" "s3://$BUCKET_NAME/$TEMPLATE_FILE" --region "$REGION" >/dev/null

TEMPLATE_URL="https://$BUCKET_NAME.s3.${REGION}.amazonaws.com/$TEMPLATE_FILE"
echo "Validando template desde URL: $TEMPLATE_URL"

if aws cloudformation validate-template --template-url "$TEMPLATE_URL" --region "$REGION" >/dev/null 2>&1; then
  echo "Template valido."
else
  echo "Error: el template contiene caracteres invalidos o formato incorrecto."
  exit 1
fi

# === Limpieza previa de recursos persistentes ===
echo "=== Verificando existencia de recursos previos ==="

if aws dynamodb describe-table --table-name "$DYNAMO_TABLE_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Eliminando tabla DynamoDB existente..."
  aws dynamodb delete-table --table-name "$DYNAMO_TABLE_NAME" --region "$REGION"
  aws dynamodb wait table-not-exists --table-name "$DYNAMO_TABLE_NAME" --region "$REGION"
fi

QUEUE_URL=$(aws sqs get-queue-url --queue-name "$QUEUE_NAME" --region "$REGION" --query 'QueueUrl' --output text 2>/dev/null || true)
if [ -n "$QUEUE_URL" ]; then
  echo "Eliminando cola SQS existente..."
  aws sqs delete-queue --queue-url "$QUEUE_URL" --region "$REGION"
fi

# === Manejo del stack ===
echo "=== Verificando stack '$STACK_NAME' ==="
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
  STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text)
  echo "Stack encontrado en estado '$STATUS'."

  if [[ "$STATUS" == "ROLLBACK_COMPLETE" || "$STATUS" == "DELETE_FAILED" || "$STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]]; then
    echo "Eliminando stack fallido..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
    echo "Creando stack nuevo..."
    aws cloudformation create-stack       --stack-name "$STACK_NAME"       --template-url "$TEMPLATE_URL"       --capabilities CAPABILITY_NAMED_IAM
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
  else
    echo "Intentando actualizar stack existente..."
    if aws cloudformation update-stack       --stack-name "$STACK_NAME"       --template-url "$TEMPLATE_URL"       --capabilities CAPABILITY_NAMED_IAM >/dev/null 2>&1; then
      aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
    else
      echo "No hay cambios que aplicar (stack sin diferencias)."
    fi
  fi
else
  echo "Creando stack nuevo..."
  aws cloudformation create-stack     --stack-name "$STACK_NAME"     --template-url "$TEMPLATE_URL"     --capabilities CAPABILITY_NAMED_IAM
  aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
fi

# === Resultado final ===
FINAL_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text)
if [[ "$FINAL_STATUS" == "CREATE_COMPLETE" || "$FINAL_STATUS" == "UPDATE_COMPLETE" ]]; then
  echo "Stack '$STACK_NAME' desplegado correctamente."
  echo "Buscando URL del API Gateway..."
  API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayInvokeURL'].OutputValue" --output text)
  if [[ "$API_URL" != "None" && -n "$API_URL" ]]; then
    echo "URL del API Gateway:"
    echo "$API_URL"
  else
    echo "No se encontró una salida 'ApiGatewayInvokeURL'."
    echo "Puedes verificar manualmente en la consola de API Gateway."
  fi
else
  echo "Error: el stack terminó en estado $FINAL_STATUS"
  echo "Revisa los eventos con:"
  echo "aws cloudformation describe-stack-events --stack-name $STACK_NAME --max-items 10"
fi