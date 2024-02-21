// src/pages/api/formatJson.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";

export const runtime = "edge";

const zodTypes: { [type: string]: () => z.ZodType<any, any> } = {
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  // 添加更多的 zod 類型如果需要
};

// 定義前端可以設置的 schema 接口
interface CustomSchema {
  [key: string]: any;
}

const TEMPLATE = `Extract the requested fields from the input.

Input:

{input}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schema: customSchema, messages } = body;
    const currentMessageContent = messages[messages.length - 1].content;

    // 從前端傳來的 customSchema 構建 Zod schema
    const schemaDefinition = Object.keys(customSchema).reduce(
      (acc, key) => {
        const { type, description } = customSchema[key];

        // 使用映射類型來獲取對應的 zod 驗證方法
        const zodType = zodTypes[type];
        if (!zodType) {
          throw new Error(`Unsupported zod type: ${type}`);
        }

        acc[key] = zodType().describe(description);
        return acc;
      },
      {} as { [key: string]: z.ZodType<any, any> },
    );

    const schema = z.object(schemaDefinition);

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new ChatOpenAI({
      temperature: 0.8,
      modelName: "gpt-3.5-turbo-1106",
    });

    const functionCallingModel = model.bind({
      functions: [
        {
          name: "output_formatter",
          description: "Format output based on dynamic schema",
          parameters: zodToJsonSchema(schema),
        },
      ],
      function_call: { name: "output_formatter" },
    });

    const chain = prompt
      .pipe(functionCallingModel)
      .pipe(new JsonOutputFunctionsParser());

    const result = await chain.invoke({
      input: currentMessageContent,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
