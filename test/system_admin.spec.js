const request = require("supertest");
const db = require("../src/db/database")
const sinon = require("sinon");
const { Sequelize } = require("sequelize");
const sequalize = new Sequelize('sqlite::memory:');
sinon.stub(db, "sequelize").returns(sequalize);
const app = require("../src/app"); // This line must be after the sequalize stub creation.
const { CLINIC_ADMIN, CLINIC_USER, SYSTEM_ADMIN, PATIENT } = require("../src/constants/constants");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const systemAdmin = {
  email_id: "system_admin@bodhi.com",
  password: "sysAdmin123",
  first_name: "Steve",
  last_name: "Anderson",
  user_type: SYSTEM_ADMIN,
  contact_no: "+9198172398712",
  dob: "1950-10-10",
  address: "White house, Australia"
};
const clinicAdmin = {
  email_id: "clinic_admin@bodhi.com",
  password: "clinicAdmin123",
  first_name: "Charlie",
  last_name: "Ambrose",
  user_type: CLINIC_ADMIN,
  clinic_id: "1234567",
  contact_no: "+9198172398712",
  dob: "1950-10-10",
  address: "White house, USA"
}
const clinicUser = {
  email_id: "clinic_user@bodhi.com",
  password: "C",
  first_name: "U",
  last_name: "Trump",
  clinic_id: "1234567",
  user_type: CLINIC_USER,
  contact_no: "+9198172398712",
  dob: "1950-10-10",
  address: "White house, USA"
}
const patient = {
  email_id: "patient@bodhi.com",
  password: "trump123",
  first_name: "Donald",
  last_name: "Trump",
  user_type: PATIENT,
  contact_no: "+9198172398712",
  dob: "1950-10-10",
  address: "White house, USA"
}
describe("System Admin Flow", () => {
  let server;
  beforeAll((done) => {
    User.sync().then(() => {
      server = app.listen(async () => {
        global.agent = request.agent(server);
        done();
      });
    }).then(() => {
      bcrypt.hash(systemAdmin.password, Number(process.env.SALT), async function (err, hash) {
        if (hash) {
          User.create({ ...systemAdmin, password: hash });
        }
      });
    })
  });

  afterAll(async () => {
    await server.close();
    await sequalize.close();
  });

  test("Login Successfully", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email_id: systemAdmin.email_id, password: systemAdmin.password });
    expect(res.statusCode).toEqual(200);
  });

  test("Login Failure", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email_id: systemAdmin.email_id, password: "wrongpassword" });
    expect(res.text).toEqual("Incorrect Username or Password");
    expect(res.statusCode).toEqual(500);
  });

  test("Create Patient & Clinic Admin by  System Admin", async () => {
    await request(app)
      .post("/user/login")
      .send({ email_id: systemAdmin.email_id, password: systemAdmin.password })
      .then(async (response) => {
        const token = response.text;
        const clinic_admin_response = await request(app)
          .post("/user")
          .set("authorization", token)
          .send(clinicAdmin);
        expect(clinic_admin_response.statusCode).toEqual(201);

        const patient_response = await request(app)
          .post("/user")
          .set("authorization", token)
          .send(patient);
        expect(patient_response.statusCode).toEqual(201);

        const clinic_user_response = await request(app)
          .post("/user")
          .set("authorization", token)
          .send(clinicUser);
        expect(clinic_user_response.statusCode).toEqual(403);
        expect(JSON.parse(clinic_user_response.text).message).toEqual("Not Authorised to perform this action");

        const get_all_user_response = await request(app)
          .get("/user?from=0&to=20")
          .set("authorization", token);
        const users = JSON.parse(get_all_user_response.text)
        result = users.map(user => {
          return user.email_id;
        })
        expect(result).toEqual(expect.arrayContaining([systemAdmin.email_id, clinicAdmin.email_id, patient.email_id]));
      });
  });
  // TODO: scenarios to write tests for:
  // 
});
