#!/usr/bin/env bash
# Sobe a API do Spring. Existe só para resolver o JAVA_HOME antes de chamar o
# Maven Wrapper: o JDK instalado pelo Homebrew é "keg-only" e não entra no PATH
# do sistema, então um `java -version` puro não enxerga nada.
set -e

cd "$(dirname "$0")"

if [ -z "$JAVA_HOME" ]; then
  if /usr/libexec/java_home -v 21 >/dev/null 2>&1; then
    JAVA_HOME="$(/usr/libexec/java_home -v 21)"
  elif [ -d /opt/homebrew/opt/openjdk@21 ]; then
    JAVA_HOME=/opt/homebrew/opt/openjdk@21
  elif [ -d /usr/local/opt/openjdk@21 ]; then
    JAVA_HOME=/usr/local/opt/openjdk@21
  else
    echo "Java 21 não encontrado. Instale com: brew install openjdk@21" >&2
    exit 1
  fi
fi

export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

exec ./mvnw -q spring-boot:run "$@"
