import { request } from "@/utils/request";

/**
 * 获取滑块验证码 Token
 *
 * 用途：
 * - 用户注册/登录前，需要先通过滑块验证获取临时 token
 * - 后端通过该 token 判断当前请求是否经过人机验证
 *
 * 参数：
 * @param data.email 用户邮箱
 * @param data.scene 验证场景，可选，例如 register/login
 *
 * 返回：
 * @returns token 滑块验证 token
 * @returns sliderToken 兼容旧接口返回字段
 */
export function getSliderToken(data: { email: string; scene?: string }) {
  return request<{ token?: string; sliderToken?: string }>({
    url: "/api/auth/slider-token",
    method: "POST",
    data,
  });
}


/**
 * 发送邮箱注册验证码
 *
 * 用途：
 * - 用户注册时，请求后端向邮箱发送验证码
 * - 发送成功后返回验证码有效时间和冷却时间
 *
 * 参数：
 * @param data.email 用户邮箱地址
 * @param data.sliderToken 滑块验证通过后的 token
 *
 * 返回：
 * @returns message 提示信息
 * @returns code 测试环境可能返回验证码（生产环境通常不返回）
 * @returns cooldownSeconds 再次发送验证码的等待时间
 * @returns expiresInSeconds 验证码有效时间
 */
export function sendRegisterCode(data: { email: string; sliderToken: string }) {
  return request<{
    message?: string;
    code?: string;
    cooldownSeconds?: number;
    expiresInSeconds?: number;
  }>({
    url: "/api/auth/send-code",
    method: "POST",
    data,
  });
}


/**
 * 注册用户账号
 *
 * 用途：
 * - 创建新的用户账户
 * - 校验用户名、邮箱、密码以及邮箱验证码
 *
 * 参数：
 * @param data.username 用户名
 * @param data.email 注册邮箱
 * @param data.password 登录密码
 * @param data.code 邮箱验证码
 *
 * 返回：
 * @returns ok 注册是否成功
 * @returns message 后端返回提示信息
 */
export function registerAccount(data: {
  username: string;
  email: string;
  password: string;
  code: string;
}) {
  return request<{ ok?: boolean; message?: string }>({
    url: "/api/auth/register",
    method: "POST",
    data,
  });
}


/**
 * 邮箱密码登录
 *
 * 用途：
 * - 用户通过邮箱和密码登录系统
 *
 * 参数：
 * @param data.email 用户邮箱
 * @param data.password 用户密码
 *
 * 返回：
 * @returns ok 登录是否成功
 */
export function loginWithEmail(data: {
  email: string;
  password: string;
}) {
  return request<{ ok?: boolean }>({
    url: "/api/auth/sign-in/email",
    method: "POST",
    data,
  });
}
