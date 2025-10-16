#!/bin/bash
set -e

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

STACK_NAME="api-usuarios-stack"
BUCKET_NAME="api-users-bucket-anavargasdev"
ZIP_FILE="api-usuarios.zip"
TEMPLATE_FILE="template.yml"
REGION="us-east-1"

echo "=== Instalando dependencias ==="
rm -rf node_modules
npm install --omit=dev
echo "Dependencias instaladas correctamente."

echo "=== Normalizando codificación del template ==="
if command -v dos2unix >/dev/null 2>&1; then
  dos2unix "$TEMPLATE_FILE" >/dev/null 2>&1 || true
fi
if command -v iconv >/dev/null 2>&1; then
  iconv -f utf-8 -t utf-8 "$TEMPLATE_FILE" -o "$TEMPLATE_FILE" || true
fi

echo "=== Verificando bucket S3 '$BUCKET_NAME' ==="
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "Bucket existente."
else
  echo "Creando bucket S3..."
  aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
fi

echo "=== Empaquetando proyecto ==="
rm -f "$ZIP_FILE"
zip -r "$ZIP_FILE" index.js src node_modules package.json package-lock.json > /dev/null
echo "Proyecto comprimido en $ZIP_FILE"

echo "=== Subiendo artefacto a S3 ==="
aws s3 cp "$ZIP_FILE" "s3://$BUCKET_NAME/$ZIP_FILE" >/dev/null
echo "Archivo subido correctamente."

echo "=== Validando template CloudFormation ==="
aws cloudformation validate-template --template-body file://$TEMPLATE_FILE >/dev/null
echo "Template válido."

echo "=== Verificando stack '$STACK_NAME' ==="
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
  STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text)
  echo "Stack encontrado en estado '$STATUS'."

  if [[ "$STATUS" == "ROLLBACK_COMPLETE" || "$STATUS" == "DELETE_FAILED" ]]; then
    echo "Eliminando stack fallido..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
    echo "Creando stack nuevo..."
    aws cloudformation create-stack \
      --stack-name "$STACK_NAME" \
      --template-body file://$TEMPLATE_FILE \
      --capabilities CAPABILITY_NAMED_IAM
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
  else
    echo "Actualizando stack existente..."
    if aws cloudformation update-stack \
      --stack-name "$STACK_NAME" \
      --template-body file://$TEMPLATE_FILE \
      --capabilities CAPABILITY_NAMED_IAM >/dev/null 2>&1; then
      aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
    else
      echo "No hay cambios que aplicar o error menor (posiblemente sin diferencias)."
    fi
  fi

else
  echo "Creando stack nuevo..."
  aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://$TEMPLATE_FILE \
    --capabilities CAPABILITY_NAMED_IAM
  aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
fi

FINAL_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text)
if [[ "$FINAL_STATUS" == "CREATE_COMPLETE" || "$FINAL_STATUS" == "UPDATE_COMPLETE" ]]; then
  echo "Stack '$STACK_NAME' desplegado correctamente."
  ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[0].OutputValue" --output text)
  echo "URL del API Gateway:"
  echo "$ENDPOINT"
else
  echo "Error: el stack terminó en estado $FINAL_STATUS"
  echo "Ejecuta para más detalles:"
  echo "aws cloudformation describe-stack-events --stack-name $STACK_NAME --max-items 10"
fi
