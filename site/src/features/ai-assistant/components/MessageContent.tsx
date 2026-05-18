import type { ReactNode } from "react";
import type { AiChatMessage } from "../../../types/api";
import styles from "../AiAssistant.module.scss";
import { parseMessageBlocks } from "../utils/messageParsing";

function renderInline(text: string): ReactNode[] {
    return text.split(/(`[^`]+`)/g).map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={index}>{part.slice(1, -1)}</code>;
        }

        return <span key={index}>{part.replace(/\*\*/g, "").replace(/__/g, "")}</span>;
    });
}

export function MessageContent({
    content,
    role,
}: {
    content: string;
    role: AiChatMessage["role"];
}) {
    if (role === "user") {
        return <p>{content}</p>;
    }

    const blocks = parseMessageBlocks(content);

    return (
        <div className={styles.messageContent}>
            {blocks.map((block, index) => {
                if (block.type === "heading") {
                    return <h3 key={index}>{renderInline(block.text)}</h3>;
                }

                if (block.type === "list") {
                    return (
                        <ul key={index}>
                            {block.items.map((item, itemIndex) => (
                                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === "code") {
                    return (
                        <pre className={styles.messageCode} key={index}>
                            <code>{block.code}</code>
                        </pre>
                    );
                }

                return <p key={index}>{renderInline(block.text)}</p>;
            })}
        </div>
    );
}
