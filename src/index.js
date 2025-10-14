require('module-alias/register');

const ServiceRouteRest = require('@infra/entry-points/service_route_rest');
const serviceRouteRest = new ServiceRouteRest();

module.exports.getUsers = async (event) => {
  return serviceRouteRest.getUsers(event);
};

module.exports.createUser = async (event) => {
  return serviceRouteRest.createUser(event);
};

module.exports.getUserByEmail = async (event) => {
  return serviceRouteRest.getUserByEmail(event);
};
