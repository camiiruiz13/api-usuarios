# api-usuarios

Repositorio para funciones Serverless en AWS Lambda que gestionan usuarios.  
Incluye configuración de infraestructura mediante CloudFormation y despliegue automatizado con Serverless Framework.

---

## Requisitos previos

Antes de iniciar, asegúrate de tener instalado:

- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Serverless Framework CLI](https://www.serverless.com/framework/docs/getting-started/)
- [AWS CLI](https://aws.amazon.com/cli/)
- Una cuenta con permisos configurados para desplegar en AWS:

```bash
aws configure


Instala los módulos requeridos:
npm install


Para obtener información del despliegue (ARNs, endpoints, etc.):
sls info

comando para despliegue
sls deploy --force


Si necesitas eliminar todos los recursos creados por Serverless:
sls remove

cloudformation:
./cloudformation.sh


#comando para probar node si hay alguna falla 
node -r module-alias/register src/index.js