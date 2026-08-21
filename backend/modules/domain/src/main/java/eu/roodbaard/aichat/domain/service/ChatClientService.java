package eu.roodbaard.aichat.domain.service;

import reactor.core.publisher.Flux;

public interface ChatClientService {

    public String chat(String message);

    public Flux<String> stream(String message);
}
