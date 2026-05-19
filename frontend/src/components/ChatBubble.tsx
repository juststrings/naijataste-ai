interface Props {
  message: string;
  type: "user" | "bot";
  isHtml?: boolean;
}

export default function ChatBubble({ message, type, isHtml }: Props) {
  if (isHtml) {
    return (
      <div
        className={type === "user" ? "chat-user" : "chat-bot"}
        dangerouslySetInnerHTML={{ __html: message }}
      />
    );
  }
  return (
    <div className={type === "user" ? "chat-user" : "chat-bot"}>
      <p>{message}</p>
    </div>
  );
}
