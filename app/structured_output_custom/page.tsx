"use client";
import { useState } from "react";

interface ISchemaItem {
  key: string;
  type: string;
  description: string;
}

const SchemaPage = () => {
  const [schemaItems, setSchemaItems] = useState<ISchemaItem[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [formatAnswer, setFormatAnswer] = useState("");

  const addSchemaItem = () => {
    setSchemaItems([
      ...schemaItems,
      { key: "", type: "string", description: "" },
    ]);
  };

  const updateSchemaItem = (
    index: number,
    field: keyof ISchemaItem,
    value: string,
  ) => {
    const newSchemaItems = [...schemaItems];
    newSchemaItems[index][field] = value;
    setSchemaItems(newSchemaItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      schema: schemaItems.reduce(
        (acc, item) => ({
          ...acc,
          [item.key]: { type: item.type, description: item.description },
        }),
        {},
      ),
      messages: [
        {
          content: messageContent, // 直接使用用戶輸入的內容
        },
      ],
    };

    // 發送 POST 請求到後端
    const response = await fetch("/api/chat/structured_output_custom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(result); // 處理回應
    setFormatAnswer(JSON.stringify(result, null, 2));
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={addSchemaItem}>
        新增 Schema 項目
      </button>
      {schemaItems.map((item, index) => (
        <div key={index} className="flex gap-2 p-2">
          <input
            value={item.key}
            onChange={(e) => updateSchemaItem(index, "key", e.target.value)}
            placeholder="鍵名"
          />
          <select
            value={item.type}
            onChange={(e) => updateSchemaItem(index, "type", e.target.value)}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
          <input
            value={item.description}
            onChange={(e) =>
              updateSchemaItem(index, "description", e.target.value)
            }
            placeholder="描述"
          />
        </div>
      ))}
      <textarea
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        placeholder="輸入 Message 內容"
        rows={10}
        style={{ width: "100%" }}
      />
      <button type="submit">提交</button>
      <pre>{formatAnswer}</pre>
    </form>
  );
};

export default SchemaPage;
