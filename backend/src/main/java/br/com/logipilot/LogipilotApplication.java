package br.com.logipilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// O Spring Security entra apenas pelo BCrypt e pelo CORS; sem esta exclusão ele
// criaria um usuário em memória e imprimiria uma senha aleatória a cada subida.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class LogipilotApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogipilotApplication.class, args);
    }
}
