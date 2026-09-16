import "server-only";

import { z } from "zod";

const javaIdSchema = z.string().regex(/^\d+$/, "Java ID 必须是十进制字符串");

export { javaIdSchema };
