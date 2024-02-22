"use client";
import { useState, useRef } from "react";

interface ISchemaItem {
  key: string;
  type: string;
  description: string;
}

const SchemaPage = () => {
  const [schemaItems, setSchemaItems] = useState<ISchemaItem[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [formatAnswer, setFormatAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(e.target.value);
    autoExpand(e);
  };
  const autoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    // Reset height to 'auto' to ensure shrinking on delete
    target.style.height = "auto";
    // Set the height to the scroll height to expand as needed
    target.style.height = `${target.scrollHeight}px`;
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatAnswer).then(
      () => {
        // Optional: Show a message that the text was copied.
        alert("Copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="flex text-3xl">Here is your schema :</p>
      <div className="justify-center flex flex-col">
        {schemaItems.map((item, index) => (
          <div key={index} className="flex m-2 gap-2">
            <input
              value={item.key}
              onChange={(e) => updateSchemaItem(index, "key", e.target.value)}
              placeholder="鍵名"
              className="p-2 rounded-md"
            />
            <select
              value={item.type}
              onChange={(e) => updateSchemaItem(index, "type", e.target.value)}
              className="p-2 rounded-md bg-transparent"
            >
              <option value="" disabled selected>
                請選擇
              </option>
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
              className="p-2 rounded-md flex-grow"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addSchemaItem}
          className="bg-black opacity-50 border-dashed border-4 border-inherit p-1 rounded-2xl w-full self-center m-5 text-3xl hover:opacity-30 text-white"
        >
          +
        </button>
      </div>
      <p className="flex text-3xl">
        Enter your input , i wiil try to format your content !
      </p>
      <div className="h-auto p-5 bg-white rounded-md flex">
        <textarea
          ref={textareaRef}
          value={messageContent}
          onChange={handleInputChange}
          placeholder="輸入 Message 內容"
          className="flex w-full text-lg h-full resize-none mr-2"
        />
        <button
          type="submit"
          className="bg-black opacity-20 h-10 self-end rounded-lg w-10 hover:opacity-50 mb-2 justify-center flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </div>
      <div className="flex gap-3">
        {formatAnswer && (
          <button
            type="button"
            onClick={copyToClipboard}
            className=" bg-slate-500 hover:bg-slate-700 text-white font-bold rounded h-10 self-center px-3"
          >
            Copy
          </button>
        )}
        <pre>{formatAnswer}</pre>
      </div>
    </form>
  );
};

export default SchemaPage;
