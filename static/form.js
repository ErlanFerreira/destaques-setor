const liderNomeInput = document.getElementById("lider-nome");
const liderCpfInput = document.getElementById("lider-cpf");
const liderConfirmacao = document.getElementById("lider-confirmacao");
const blocoFuncionarios = document.getElementById("bloco-funcionarios");
const listaFuncionarios = document.getElementById("lista-funcionarios");
const btnEnviar = document.getElementById("btn-enviar");
const msgEl = document.getElementById("msg");
const form = document.getElementById("form-voto");
const sucessoEl = document.getElementById("sucesso");

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

function formatarCpf(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  const partes = [digitos.slice(0, 3), digitos.slice(3, 6), digitos.slice(6, 9), digitos.slice(9, 11)];
  let formatado = partes[0];
  if (partes[1]) formatado += "." + partes[1];
  if (partes[2]) formatado += "." + partes[2];
  if (partes[3]) formatado += "-" + partes[3];
  return formatado;
}

liderCpfInput.addEventListener("input", () => {
  liderCpfInput.value = formatarCpf(liderCpfInput.value);
  tentarVerificar();
});

liderNomeInput.addEventListener("input", () => {
  liderAtual = null;
  liderConfirmacao.hidden = true;
  limparFuncionarios();
  tentarVerificar();
});

async function tentarVerificar() {
  limparErro();
  const nome = liderNomeInput.value.trim();
  const cpf = liderCpfInput.value.replace(/\D/g, "");
  if (!nome || cpf.length !== 11) {
    liderAtual = null;
    liderConfirmacao.hidden = true;
    limparFuncionarios();
    return;
  }

  const resp = await fetch("/api/lideres/verificar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, cpf }),
  });
  const data = await resp.json();

  if (!resp.ok) {
    liderAtual = null;
    liderConfirmacao.hidden = true;
    limparFuncionarios();
    mostrarErro(data.erro || "Não foi possível verificar seus dados.");
    return;
  }

  liderAtual = data;
  liderConfirmacao.textContent = `Setor(es): ${liderAtual.setor}`;
  liderConfirmacao.hidden = false;

  const funcResp = await fetch(`/api/funcionarios?lider_id=${liderAtual.id}`);
  const funcData = await funcResp.json();
  listaFuncionarios.innerHTML = "";
  for (const f of funcData.funcionarios) {
    const label = document.createElement("label");
    label.className = "opcao-radio";
    label.innerHTML = `<input type="radio" name="funcionario" value="${f.id}"> <span>${f.nome}</span>`;
    listaFuncionarios.appendChild(label);
  }
  blocoFuncionarios.hidden = funcData.funcionarios.length === 0;
  if (funcData.funcionarios.length === 0) {
    mostrarErro("Nenhum liderado cadastrado para este líder.");
  }
}

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
