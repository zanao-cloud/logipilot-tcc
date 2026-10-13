package br.com.logipilot.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * O Spring Security entra aqui por causa do BCrypt e do CORS. A autorização
 * continua sendo feita no front-end (ProtectedRoute), como no projeto original:
 * as rotas da API ficam abertas para o Vite poder consumi-las em localhost.
 */
@Configuration
@EnableWebSecurity
public class ConfiguracaoSeguranca {

    private final List<String> origensPermitidas;

    public ConfiguracaoSeguranca(@Value("${logipilot.cors.origens}") List<String> origensPermitidas) {
        this.origensPermitidas = origensPermitidas;
    }

    @Bean
    public PasswordEncoder codificadorDeSenha() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filtros(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                // Não há sessão nem cookie: cada requisição é independente.
                .csrf(csrf -> csrf.disable())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .authorizeHttpRequests(rotas -> rotas.anyRequest().permitAll())
                .build();
    }

    @Bean
    public CorsConfigurationSource configuracaoCors() {
        CorsConfiguration configuracao = new CorsConfiguration();
        configuracao.setAllowedOrigins(origensPermitidas);
        configuracao.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracao.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", configuracao);

        return fonte;
    }
}
