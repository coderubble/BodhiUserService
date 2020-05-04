const ClinicUser = require("../models/clinic_user.model");
const User = require("../models/user.model");
const { generateAuthToken } = require("../utility/token");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../db/database");
const { CLINIC_ADMIN, CLINIC_USER, SYSTEM_ADMIN, PATIENT } = require("../constants/constants")

exports.userLogin = function ({ email_id, password }, callback) {
  User.findOne({
    where: { email_id }
  }).then((user) => {
    bcrypt.compare(password, user.password, async function (error, result) {
      //If passwords match,check user_type
      if (result) {
        //If user_type is Clinic Admin or Clinic User,get clinic_id from ClinicUser table and set it to user object
        let user_clone = { email_id: user.email_id, user_type: user.user_type, clinic_id: null }
        if ([CLINIC_ADMIN, CLINIC_USER].includes(user.user_type)) {
          await ClinicUser.findOne({ where: { email_id } }).then((clinic_user) => {
            user_clone.clinic_id = clinic_user.clinic_id;
          })
        }
        callback(null, generateAuthToken(user_clone));
      } else {
        console.error(`bcrypt Error: ${error}`)
        callback("Incorrect Username or Password");
      }
    });
  }).catch((error) => {
    console.error(`Error: ${error}`);
    callback("User not found");
  });
};

exports.userGetAll = async function ({ from, to }, callback) {
  const to_record = to || 1;
  const offset = from || 0;
  const limit = Math.min(25, to_record - offset);
  const seq = sequelize();
  const records = await seq.query(`select u.email_id, '*****' as password, first_name, last_name, dob, user_type,address, contact_no,c.clinic_id 
  from users u left outer join clinic_users c on u.email_id = c.email_id limit ${limit} offset ${offset} `,
    {
      type: User.SELECT
    });
  console.log(`%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%${JSON.stringify(records[0], null, 3)}`);
  callback(null, records[0]);
  // User.findAndCountAll({
  //   include: [
  //     { model: ClinicUser }
  //   ],
  //   limit,
  //   offset,
  //   order: [["email_id", "ASC"]]
  // }, { plain: true },
  // ).then((users) => {
  //   callback(null, maskedUser(users.rows));
  // }).catch((error) => {
  //   console.error(`Error: ${error}`);
  //   callback(error);
  // });
};

exports.userGetByEmail = function ({ email_id }, callback) {
  User.findOne({
    where: { email_id }
  }).then((user) => {
    callback(null, maskedUser(user));
  }).catch((error) => {
    console.error(`Error: ${error}`);
    callback(error);
  });
};

function maskedUser(users) {
  if (!Array.isArray(users)) {
    users = [users];
  }
  return users.map(user => Object.assign({}, { ...user.toJSON(), password: "******" }));
}

exports.userInsert = function (userData, loggedInUser, callback) {
  bcrypt.hash(userData.password, Number(process.env.SALT), async function (err, hash) {
    if (hash) {
      let transaction = null;
      try {
        transaction = await sequelize().transaction();
        const user = await User.create({ ...userData, password: hash }, { transaction });
        if (userData.user_type !== PATIENT) {
          let { clinic_id, user_type } = loggedInUser;
          if (user_type === SYSTEM_ADMIN) {
            clinic_id = userData.clinic_id
          }
          await ClinicUser.create({ clinic_id, email_id: userData.email_id }, { transaction });
        }
        await transaction.commit();
        if (user) {
          callback(null, { message: `Created Record: ${user.email_id}` });
        }
      } catch (error) {
        console.error(`Error: ${error}`);
        await transaction.rollback();
        callback(error);
      }
    } else {
      callback("Insert Failed");
    }
  });
};

exports.userUpdate = function ({ email_id, first_name, last_name, dob, address, contact_no }, callback) {
  User.update({
    first_name,
    last_name,
    dob,
    address,
    contact_no
  }, {
    where: { email_id }
  }).then((result) => {
    callback(null, { message: `Updated Record: ${result}` });
  }).catch((error) => {
    console.error(`Error: ${error}`);
    callback(error);
  });
};

exports.userDelete = function ({ email_id }, callback) {
  User.destroy({ where: { email_id } }).then((result) => {
    callback(null, { message: `Deleted Record: ${result}` });
  }).catch((error) => {
    console.error(`Error: ${error}`);
    callback(error);
  });
};