require('dotenv').config();
const { createContainer, asClass, asValue } = require('awilix');
const container = createContainer();

// User module's all dependency
const userModule = require("~/dependency/userDependency");
container.register(userModule);


// Global files
container.register({
  db: asValue(require("~/config/knexfile")),
  logger: asValue(require("~/utils/logger").default),
  DateTimeUtil: asClass(require('~/utils/DateTimeUtil')).singleton(),
  passwordHash: asValue(require("~/utils/passwordHash").default),
  checkApiHeaders: asValue(require("~/middlewares/checkApiHeaders")),
  authenticate: asValue(require("~/middlewares/authenticate")),
  JwtAuthSecurity: asClass(require('~/libraries/JwtAuthSecurity')).singleton(),
  Email: asClass(require('~/libraries/Email')).singleton(),
  FileUpload: asClass(require('~/libraries/FileUpload')).singleton(),
  FirebaseLib: asClass(require('~/libraries/FirebaseLib')).singleton(),
  commonHelpers: asValue(require("~/helpers/commonHelpers").default),
  notificationHelper: asClass(require("~/helpers/notificationHelper")).singleton(),
  verifyAccess: asValue(require("~/middlewares/verifyAccess")),
  commonConstants: asValue(require('~/constants/commonConstants').default),
  folderConstants: asValue(require('~/constants/folderConstants').default),
  tableConstants: asValue(require('~/constants/tableConstants').default),
  responseCodeConstant: asValue(require('~/constants/responseCodeConstant').default),
  BaseModel: asClass(require('~/models/BaseModel').default),
  TwilioObj: asClass(require('~/libraries/Twilio')).singleton(),
  DateTimeLib: asClass(require('~/libraries/DateTime')).singleton()
});

// Response handler file
container.register({
  responseHandler: asClass(require('~/middlewares/responseHandler')).singleton()
});

// Make the container available for other parts of your application
module.exports = container;