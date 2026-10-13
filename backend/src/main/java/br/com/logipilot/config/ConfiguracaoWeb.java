package br.com.logipilot.config;

import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Prioridade;
import br.com.logipilot.dominio.StatusEntrega;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * No corpo JSON os enums já são lidos em minúsculas pelo @JsonCreator, mas o
 * Jackson não participa da conversão de parâmetros de URL: sem os conversores
 * abaixo, "?papel=motorista" devolveria 400 e só "?papel=MOTORISTA" passaria.
 */
@Configuration
public class ConfiguracaoWeb implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registro) {
        registro.addConverter(String.class, Papel.class, Papel::deJson);
        registro.addConverter(String.class, StatusEntrega.class, StatusEntrega::deJson);
        registro.addConverter(String.class, Prioridade.class, Prioridade::deJson);
    }
}
