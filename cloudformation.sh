#!/bin/bash
set -e

STACK_NAME="api-usuarios-stack"
BUCKET_NAME="api-users-bucket-anavargasdev"
ZIP_FILE="api-usuarios.zip"
TEMPLATE_FILE="template.yml"
REGION="us-east-1"

# Lambdas definidas en tu template.yml
LAMBDA_GET="api-usuarios-stack-getUsers"
LAMBDA_POST="api-usuarios-stack-createUser"
LAMBDA_EMAIL="api-usuarios-stack-getUserByEmail"

echo "Verificando si el bucket S3 '$BUCKET_NAME' existe..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "Bucket S3 '$BUCKET_NAME' ya existe."
else
  echo "Bucket S3 '$BUCKET_NAME' no existe. Creando..."
  aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
fi

echo "Limpiando empaquetado previo..."
rm -f "$ZIP_FILE"
zip -r "$ZIP_FILE" src package.json node_modules > /dev/null
echo "Proyecto comprimido en $ZIP_FILE"

echo "Subiendo $ZIP_FILE al bucket S3: $BUCKET_NAME"
aws s3 cp "$ZIP_FILE" "s3://$BUCKET_NAME/$ZIP_FILE"

for LAMBDA in "$LAMBDA_GET" "$LAMBDA_POST" "$LAMBDA_EMAIL"; do
  echo "Verificando si la función Lambda '$LAMBDA' existe..."
  if aws lambda get-function --function-name "$LAMBDA" >/dev/null 2>&1; then
    echo "Lambda '$LAMBDA' existe. Actualizando código..."
    aws lambda update-function-code --function-name "$LAMBDA" \
      --s3-bucket "$BUCKET_NAME" \
      --s3-key "$ZIP_FILE" >/dev/null
  else
    echo "Lambda '$LAMBDA' no existe. Se creará desde el stack."
  fi
done

echo "Verificando si el stack CloudFormation '$STACK_NAME' existe..."
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
  STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].StackStatus" --output text)
  if [[ "$STATUS" == "ROLLBACK_COMPLETE" || "$STATUS" == "DELETE_FAILED" || "$STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]]; then
    echo "El stack '$STACK_NAME' está en estado $STATUS. Eliminando..."
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
    echo "Stack eliminado. Creando nuevamente..."
    aws cloudformation create-stack \
      --stack-name "$STACK_NAME" \
      --template-body file://$TEMPLATE_FILE \
      --capabilities CAPABILITY_IAM
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
  else
    echo "Stack existente con estado '$STATUS'. Intentando actualización..."
    set +e
    aws cloudformation update-stack \
      --stack-name "$STACK_NAME" \
      --template-body file://$TEMPLATE_FILE \
      --capabilities CAPABILITY_IAM
    if [[ $? -ne 0 ]]; then
      echo "No hay cambios que aplicar o error menor."
    fi
    set -e
    aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" || true
  fi
else
  echo "Stack no existe. Creando..."
  aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://$TEMPLATE_FILE \
    --capabilities CAPABILITY_IAM
  aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" || true
fi

FINAL_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].StackStatus" --output text)

if [[ "$FINAL_STATUS" == "CREATE_COMPLETE" || "$FINAL_STATUS" == "UPDATE_COMPLETE" ]]; then
  echo "Stack completado correctamente."
  ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayInvokeURL'].OutputValue" \
    --output text)
  echo "URL de la API: $ENDPOINT"
else
  echo "Error: el stack terminó en estado $FINAL_STATUS."
  echo "Revisa eventos con:"
  echo "aws cloudformation describe-stack-events --stack-name $STACK_NAME --max-items 10"
fi
