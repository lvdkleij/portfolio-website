package eu.roodbaard.aichat.infrastructure.rest.controller;

import eu.roodbaard.aichat.domain.service.ChatClientService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatClientService chatClientService;

    public ChatController(ChatClientService chatClientService) {
        this.chatClientService = chatClientService;

    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(@RequestParam("message") String message) {
        return chatClientService.stream(message);
    }
}
