const liderInput = document.getElementById("lider-nome");
const lideresLista = document.getElementById("lideres-lista");
const liderConfirmacao = document.getElementById("lider-confirmacao");
const blocoFuncionarios = document.getElementById("bloco-funcionarios");
const listaFuncionarios = document.getElementById("lista-funcionarios");
const btnEnviar = document.getElementById("btn-enviar");
const msgEl = document.getElementById("msg");
const form = document.getElementById("form-voto");
const sucessoEl = document.getElementById("sucesso");

let lideres = [];
let liderAtual = null;

function mostrarErro(texto) {
  msgEl.textContent = texto;
  msgEl.hidden = false;
  msgEl.className = "msg erro";
}

function limparErro() {
  msgEl.hidden = true;
}

function limparFuncionarios() {
  blocoFuncionarios.hidden = true;
  listaFuncionarios.innerHTML = "";
  btnEnviar.disabled = true;
}

function normalizar(texto) {
  return texto.trim().toLowerCase();
}

(async function carregarLideres() {
  const resp = await fetch("/api/lideres/todos");
  const data = await resp.json();
  lideres = data.lideres;
  for (const l of lideres) {
    const opt = document.createElement("option");
    opt.value = l.nome;
    lideresLista.appendChild(opt);
  }
})();

liderInput.addEventListener("input", async () => {
  limparErro();
  liderConfirmacao.hidden = true;
  limparFuncionarios();
  liderAtual = null;

  const valor = normalizar(liderInput.value);
  if (!valor) return;

  const encontrados = lideres.filter((l) => normalizar(l.nome) === valor);
  if (encontrados.length === 0) return;
  if (encontrados.length > 1) {
    mostrarErro("Encontrei mais de um líder com esse nome, fale com o administrador.");
    return;
  }

  liderAtual = encontrados[0];
  liderConfirmacao.textContent = `Setor: ${liderAtual.setor}`;
  liderConfirmacao.hidden = false;

  const resp = await fetch(`/api/funcionarios?lider_id=${liderAtual.id}`);
  const data = await resp.json();
  listaFuncionarios.innerHTML = "";
  for (const f of data.funcionarios) {
    const label = document.createElement("label");
    label.className = "opcao-radio";
    label.innerHTML = `<input type="radio" name="funcionario" value="${f.id}"> <span>${f.nome}</span>`;
    listaFuncionarios.appendChild(label);
  }
  blocoFuncionarios.hidden = data.funcionarios.length === 0;
  if (data.funcionarios.length === 0) {
    mostrarErro("Nenhum liderado cadastrado para este líder.");
  }
});

listaFuncionarios.addEventListener("change", () => {
  btnEnviar.disabled = !listaFuncionarios.querySelector("input:checked");
});

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  limparErro();
  const funcionarioInput = listaFuncionarios.querySelector("input:checked");
  if (!liderAtual || !funcionarioInput) return;

  btnEnviar.disabled = true;
  const resp = await fetch("/api/votos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lider_id: liderAtual.id,
      funcionario_id: Number(funcionarioInput.value),
    }),
  });
  const data = await resp.json();

  if (!resp.ok) {
    mostrarErro(data.erro || "Não foi possível registrar o voto.");
    btnEnviar.disabled = false;
    return;
  }

  form.hidden = true;
  sucessoEl.hidden = false;
});
