import { useQuery } from "@tanstack/react-query";

import { Typography } from "../Typography";
import { Button } from "@/components/ui/button";
import { CardChatbot } from "../CardChatbot";

import {
  chatbotService,
  ServerPipelineConfig,
} from "../../services/chatbot-service";

export function PageChatbots() {
  const { data: chatbots, isLoading } = useQuery({
    queryKey: ["chatbots"],
    queryFn: () => chatbotService.fetchChatbots(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <header className="flex justify-between items-baseline mb-8">
        <Typography variant="h3">Chatbots</Typography>
        <Button variant="default">Create new chatbot</Button>
      </header>
      {chatbots ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map((chatbot: ServerPipelineConfig) => (
            <CardChatbot key={chatbot.id} chatbot={chatbot} />
          ))}
        </ul>
      ) : (
        <p>No chatbots found</p>
      )}
    </>
  );
}
