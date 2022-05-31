import { Application } from "egg";
import { close, createApp } from "@midwayjs/mock";
import { Framework } from "@midwayjs/web";
import { UserService } from "../../src/service/user";


describe("test/controller/user.test.ts", () => {
  let app: Application;
  let userService: UserService;

  beforeAll(async () => {
    // create app
    app = await createApp<Framework>();
    userService = await app.getApplicationContext().getAsync<UserService>(UserService);
  });

  afterAll(async () => {
    await close(app);
  });

  it("should GET /", async () => {
    let userName = "VicoHu";
    const userInfo = await userService.getUser({
      uid: userName
    });
    expect(userInfo).not.toBeNull();
    expect(userInfo.uid).toBe(userName);
  });
});
