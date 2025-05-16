import { z } from "zod"

export default z.object({
  "faq": z.object({
    "id": z.number().int(), "voice": z.any(), "domain": z.string(), "path": z.string(), "cookies": z.record(z.string()), "scenes": z.array(z.object({
      "scene": z.array(z.record(z.any()).and(z.any().superRefine((x, ctx) => {
        const schemas = [z.object({ "say": z.string() }).strict(), z.object({ "fill": z.record(z.string()) }).strict(), z.object({ "click": z.string() }).strict(), z.object({ "select": z.record(z.string()) }).strict()]
        const errors = schemas.reduce<z.ZodError[]>(
          (errors, schema) =>
            ((result) =>
              result.error ? [...errors, result.error] : errors)(
                schema.safeParse(x),
              ),
          [],
        )
        if (schemas.length - errors.length !== 1) {
          ctx.addIssue({
            path: ctx.path,
            code: "invalid_union",
            unionErrors: errors,
            message: "Invalid input: Should pass single schema",
          })
        }
      })))
    }))
  })
})

