require('dotenv').config();
const { createContainer, asClass, asValue } = require('awilix');
const container = createContainer();

// User module's all dependency
const userModule = require("~/dependency/userDependency");
const ingestModule = require("~/dependency/ingestDependency");
container.register(userModule);
container.register(ingestModule);


// Global files
container.register({
  db: asValue(require("~/config/knexfile")),
  logger: asValue(require("~/utils/logger").default),
  DateTimeUtil: asClass(require('~/utils/DateTimeUtil')).singleton(),
  passwordHash: asValue(require("~/utils/passwordHash").default),
  authenticate: asValue(require("~/middlewares/authenticate")),
  verifyAccess: asValue(require("~/middlewares/verifyAccess")),
  checkApiHeaders: asValue(require("~/middlewares/checkApiHeaders")),
  authorizePartner: asValue(require("~/middlewares/authorizePartner")),
  responseHandler: asClass(require("~/middlewares/responseHandler")).singleton(),
  // Email: asClass(require('~/libraries/Email')).singleton(),
  TwilioObj: asClass(require('~/libraries/Twilio')).singleton(),
  FileUpload: asClass(require('~/libraries/FileUpload')).singleton(),
  FirebaseLib: asClass(require('~/libraries/FirebaseLib')).singleton(),
  DateTimeLib: asClass(require('~/libraries/DateTime')).singleton(),
  JwtAuthSecurity: asClass(require('~/libraries/JwtAuthSecurity')).singleton(),
  commonHelpers: asValue(require("~/helpers/commonHelpers").default),
  notificationHelper: asClass(require("~/helpers/notificationHelper")).singleton(),
  commonConstants: asValue(require('~/constants/commonConstants').default),
  folderConstants: asValue(require('~/constants/folderConstants').default),
  tableConstants: asValue(require('~/constants/tableConstants').default),
  responseCodeConstant: asValue(require('~/constants/responseCodeConstant').default),
  BaseModel: asClass(require('~/models/BaseModel').default),
});

// Make the container available for other parts of your application
module.exports = container;