import { useEffect } from "react";
import { Typography } from "./Typography";
import { Card } from "./ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

import { Button } from "./ui/button";
import { pipelineConfigSchema } from "../service/service";
import service from "../service/service";

interface ChatbotConfigurationProps {
  id: number;
}

type Checked = DropdownMenuCheckboxItemProps["checked"];

export function ChatbotConfiguration({ id }: ChatbotConfigurationProps) {
  const form = useForm<z.infer<typeof pipelineConfigSchema>>({
    resolver: zodResolver(pipelineConfigSchema),
    defaultValues: {
      generative_model: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof pipelineConfigSchema>) =>
      service.updateChatbot(id, data),
  });

  const { data: knowledgeBases, isLoading: isKnowledgeBasesLoading } = useQuery(
    {
      queryKey: ["knowledgeBases"],
      queryFn: service.fetchKnowledgeBases,
    }
  );

  const { data: chatbot, isLoading: isChatbotLoading } = useQuery({
    queryKey: ["chatbot", id],
    queryFn: () => service.fetchChatbotById(id),
  });

  useEffect(() => {
    if (chatbot && !isChatbotLoading) {
      form.setValue("knowledge_bases", chatbot.knowledge_bases);
      form.setValue("generative_model", chatbot.generative_model);
    }
  }, [chatbot, isChatbotLoading, form]);

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  if (isKnowledgeBasesLoading || isChatbotLoading) return <div>Loading...</div>;

  return (
    <Card className="h-full flex flex-col px-6">
      <header>
        <Typography variant="h4">Configuration</Typography>
      </header>
      <Form {...form}>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="mt-4">
            <FormField
              control={form.control}
              name="knowledge_bases"
              render={() => (
                <FormItem>
                  <FormLabel>Knowledge Bases</FormLabel>
                  <FormControl>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            {(form.getValues("knowledge_bases") ?? []).length}{" "}
                            knowledge base(s) selected
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Knowledge Bases</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {knowledgeBases.map(
                            (kb: z.infer<typeof pipelineConfigSchema>) => (
                              <DropdownMenuCheckboxItem
                                key={kb.id}
                                checked={(
                                  form.getValues("knowledge_bases") ?? []
                                ).includes(kb.name)}
                                onCheckedChange={(checked: Checked) => {
                                  const currentKbs =
                                    form.getValues("knowledge_bases") ?? [];
                                  if (checked) {
                                    form.setValue("knowledge_bases", [
                                      ...currentKbs,
                                      kb.name,
                                    ]);
                                  } else {
                                    form.setValue(
                                      "knowledge_bases",
                                      currentKbs.filter(
                                        (name: string) => name !== kb.name
                                      )
                                    );
                                  }
                                }}
                                onSelect={(e) => e.preventDefault()}
                              >
                                {kb.name}
                              </DropdownMenuCheckboxItem>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </FormControl>
                  <FormDescription>
                    The knowledge base(s) that the chatbot will reference to
                    generate responses.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="generative_model"
              render={() => (
                <FormItem>
                  <FormLabel>Generative Model</FormLabel>
                  <FormControl>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Generative Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">
                          gpt-3.5-turbo
                        </SelectItem>
                        <SelectItem value="option-2">Option 2</SelectItem>
                        <SelectItem value="option-3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    The model that is provided context and generates the
                    response.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </Form>
    </Card>
  );
}
