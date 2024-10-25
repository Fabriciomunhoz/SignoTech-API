const mysql = require("mysql2/promise");
const client = mysql.createPool(process.env.CONNECTION_STRING);

async function verificarCriarTabelaEnquetes() {
  try {
    const connection = await client.getConnection();

    const [rows] = await connection.execute("SHOW TABLES LIKE 'enquetes'");
    if (rows.length === 0) {
      await connection.execute(`
                CREATE TABLE enquetes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    titulo VARCHAR(30) NOT NULL,
                    data_inicio DATETIME NOT NULL,
                    data_final DATETIME NOT NULL
                )
            `);
      console.log("Tabela 'enquetes' criada com sucesso.");
    }

    const [rowsOpcoes] = await connection.execute("SHOW TABLES LIKE 'opcoes'");
    if (rowsOpcoes.length === 0) {
      await connection.execute(`
                CREATE TABLE opcoes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    enquete_id INT,
                    texto VARCHAR(100) NOT NULL,
                    votos INT DEFAULT 0,
                    FOREIGN KEY (enquete_id) REFERENCES enquetes(id) ON DELETE CASCADE
                )
            `);
      console.log("Tabela 'opcoes' criada com sucesso.");
    }

    connection.release();
  } catch (error) {
    console.error("Erro ao verificar ou criar as tabelas:", error);
  }
}

verificarCriarTabelaEnquetes();

async function selectAllEnquetes() {
  const [rows] = await client.query("SELECT * FROM enquetes");
  return rows;
}

async function selectEnqueteById(id) {
  const [enquete] = await client.query("SELECT * FROM enquetes WHERE id = ?", [
    id,
  ]);
  if (enquete.length === 0) return null;

  const [opcoes] = await client.query(
    "SELECT * FROM opcoes WHERE enquete_id = ?",
    [id]
  );

  return {
    ...enquete[0],
    opcoes,
  };
}

async function createEnquete(enquete) {
  const { titulo, data_inicio, data_final, opcoes } = enquete;
  const [result] = await client.query(
    "INSERT INTO enquetes (titulo, data_inicio, data_final) VALUES (?, ?, ?)",
    [titulo, data_inicio, data_final]
  );
  const enqueteId = result.insertId;

  if (opcoes && opcoes.length > 0) {
    const opcoesPromises = opcoes.map(
      (opcao) =>
        client.query("INSERT INTO opcoes (enquete_id, texto) VALUES (?, ?)", [
          enqueteId,
          opcao.texto,
        ])
    );
    await Promise.all(opcoesPromises);
  }
  return { id: enqueteId, titulo, data_inicio, data_final, opcoes };
}

async function updateEnquete(id, enquete) {
  const { titulo, data_inicio, data_final, opcoes } = enquete;

  await client.query(
    "UPDATE enquetes SET titulo = ?, data_inicio = ?, data_final = ? WHERE id = ?",
    [titulo, data_inicio, data_final, id]
  );

  await client.query("DELETE FROM opcoes WHERE enquete_id = ?", [id]);

  for (const opcao of opcoes) {
    await client.query(
      "INSERT INTO opcoes (enquete_id, texto) VALUES (?, ?)",
      [id, opcao]
    );
  }
  return { id, titulo, data_inicio, data_final, opcoes };
}


async function deleteEnquete(id) {
  await client.query("DELETE FROM enquetes WHERE id = ?", [id]);
  return { message: "Enquete deletada com sucesso!" };
}
async function voteOption(opcaoId) {
  await client.query("UPDATE opcoes SET votos = votos + 1 WHERE id = ?", [
    opcaoId,
  ]);
  return { message: "Voto registrado com sucesso!" };
}

module.exports = {
  selectAllEnquetes,
  selectEnqueteById,
  createEnquete,
  updateEnquete,
  deleteEnquete,
  voteOption,
};
