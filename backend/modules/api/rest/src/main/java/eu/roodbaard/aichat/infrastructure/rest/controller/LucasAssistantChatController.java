package eu.roodbaard.aichat.infrastructure.rest.controller;

import eu.roodbaard.aichat.domain.service.ChatClientService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/lucasai")
public class LucasAssistantChatController {

    private final ChatClientService chatClientService;

    public LucasAssistantChatController(@Qualifier("lucasAssistantChatClientService") ChatClientService chatClientService) {
        this.chatClientService = chatClientService;
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(@RequestParam("message") String message) {
        return chatClientService.stream(message);
    }
}
