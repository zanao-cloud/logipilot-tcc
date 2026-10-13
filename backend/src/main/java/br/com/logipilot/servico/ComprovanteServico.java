package br.com.logipilot.servico;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Guarda a foto do comprovante no disco, e não no banco: imagem em coluna
 * incha o dump e deixa qualquer consulta lenta. No banco fica só o nome do
 * arquivo.
 */
@Service
public class ComprovanteServico {

    private static final List<String> TIPOS_ACEITOS =
            List.of("image/jpeg", "image/png", "image/webp", "image/heic");

    private static final long TAMANHO_MAXIMO = 8L * 1024 * 1024;

    private final Path diretorio;

    public ComprovanteServico(@Value("${logipilot.comprovantes.diretorio}") String diretorio) {
        this.diretorio = Paths.get(diretorio).toAbsolutePath().normalize();
    }

    public String guardar(Long entregaId, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraDeNegocioException("Envie uma foto para o comprovante.");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new RegraDeNegocioException("A foto passa de 8 MB. Tire uma foto menor.");
        }

        String tipo = arquivo.getContentType() == null
                ? ""
                : arquivo.getContentType().toLowerCase(Locale.ROOT);

        if (!TIPOS_ACEITOS.contains(tipo)) {
            throw new RegraDeNegocioException("O comprovante precisa ser uma imagem (JPG, PNG ou WebP).");
        }

        // O nome vem do id da entrega, nunca do arquivo enviado: nome de upload
        // é dado do usuário e poderia carregar ".." para escapar do diretório.
        String nome = "entrega-%d.%s".formatted(entregaId, extensao(tipo));

        try {
            Files.createDirectories(diretorio);
            Files.copy(arquivo.getInputStream(), diretorio.resolve(nome),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException excecao) {
            throw new RegraDeNegocioException("Não foi possível guardar a foto do comprovante.");
        }

        return nome;
    }

    public Path caminhoDe(String nomeDoArquivo) {
        Path caminho = diretorio.resolve(nomeDoArquivo).normalize();

        if (!caminho.startsWith(diretorio)) {
            throw new RecursoNaoEncontradoException("Comprovante não encontrado.");
        }
        if (!Files.isReadable(caminho)) {
            throw new RecursoNaoEncontradoException("Comprovante não encontrado.");
        }

        return caminho;
    }

    public String tipoDe(String nomeDoArquivo) {
        if (nomeDoArquivo.endsWith(".png")) {
            return "image/png";
        }
        if (nomeDoArquivo.endsWith(".webp")) {
            return "image/webp";
        }
        if (nomeDoArquivo.endsWith(".heic")) {
            return "image/heic";
        }
        return "image/jpeg";
    }

    private String extensao(String tipo) {
        return switch (tipo) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/heic" -> "heic";
            default -> "jpg";
        };
    }
}
