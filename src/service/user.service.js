const UserFactory = require("../repository/user_repository");
const bcrypt = require("bcryptjs");

exports.userLogin = function ({ email_id, password }, callback) {
  UserFactory.getUser().findOne({
    where: { email_id }
  }).then((user) => {
    bcrypt.compare(password, user.password, function (error, result) {
      if (result) {
        callback(null, UserFactory.getUser().generateAuthToken(user));
      } else {
        callback("Incorrect Username or Password");
      }
    });
  }).catch((error) => {
    callback(error);
  });
};

exports.userGetAll = function ({ from, to }, callback) {
  const to_record = to || 1;
  const offset = from || 0;
  const limit = Math.min(25, to_record - offset);
  UserFactory.getUser().findAndCountAll({
    limit,
    offset,
    order: [["email_id", "ASC"]]
  },{ plain: true }).then((users) => {
    
    users=users.rows;
    callback(null, users.map(user => maskedUser(user)));
  }).catch((error) => {
    callback(error);
  });
};

exports.userGetByEmail = function ({ email_id }, callback) {
  UserFactory.getUser().findOne({
    where: { email_id }
  }).then((user) => {
    callback(null, maskedUser(user));
  }).catch((error) => {
    callback(error);
  });
};

function maskedUser(user) {
  return Object.assign({}, { ...user.toJSON(), password: "******" });
}

exports.userInsert = function ({ email_id, user_type, first_name, last_name, dob, address, contact_no, password }, callback) {
  let userData = { email_id, user_type, first_name, last_name, dob, address, contact_no };
  bcrypt.hash(password, Number(process.env.SALT), function (err, hash) {
    if (hash) {
      userData.password = hash;
      UserFactory.getUser().create(userData).then((user) => {
        callback(null, { message: `Created Record: ${user.email_id}` });
      }).catch((error) => {
        callback(error);
      });
    }
    else {
      callback("Insert Failed");
    }
  });
};

exports.userUpdate = function ({ email_id, first_name, last_name, dob, address, contact_no }, callback) {
  UserFactory.getUser().update({
    first_name,
    last_name,
    dob,
    address,
    contact_no
  }, {
    where: { email_id }
  }).then((user) => {
    callback(null, { message: `Updated Record: ${user.email_id}` });
  }).catch((error) => {
    callback(error);
  });
};

exports.userDelete = function ({ email_id }, callback) {
  UserFactory.getUser().destroy({ where: { email_id } }).then((user) => {
    callback(null, { message: `Deleted Record: ${user.email_id}` });
  }).catch((error) => {
    callback(error);
  });
};