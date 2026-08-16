package eu.roodbaard.aichat.infrastructure.chatclient;

import eu.roodbaard.aichat.domain.service.ChatClientService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class OpenApiChatClientService implements ChatClientService {

    private final ChatClient chatClient;

    public OpenApiChatClientService(@Qualifier("openAiChatClient") ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public String chat(String message) {
        return this.chatClient.prompt().user(message).call().content();
    }




}
