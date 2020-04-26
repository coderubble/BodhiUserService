const request = require("supertest");
const app = require("../src/app");

describe("User Service", () => {

  beforeAll(async () => {
    console.log("Inside before all");
    try {
      const login = await request(app)
        .post("/user/login")
        .send({ "email_id": "scott@usa.com", "password": "scott123" });
      const token = login.header["x-auth-token"];
      const res = await request(app)
        .delete("/user/scott%40usa.com")
        .set('x-access-token', token);
    } catch (error) {
      console.log(`>>Catch Error: ${error}`);
    }
  });

  test("Create User", async () => {
    const res = await request(app)
      .post("/user")
      .send({
        "email_id": "scott@usa.com",
        "password": "scott123",
        "first_name": "Donald",
        "last_name": "Trump",
        "user_type": "S",
        "contact_no": "+9198172398712",
        "dob": "1950-10-10",
        "address": "White house, USA"
      });
    expect(res.statusCode).toEqual(201);
  });

  test("Login Failure", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ "email_id": "scott@usa.com", "password": "wrongpassword" });
    expect(res.statusCode).toEqual(500);
  });

  test("Login Success", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ "email_id": "scott@usa.com", "password": "scott123" });
    expect(res.statusCode).toEqual(200);
  });
});