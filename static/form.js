const setorSel = document.getElementById("setor");
const blocoLider = document.getElementById("bloco-lider");
const liderSel = document.getElementById("lider");
const blocoFuncionarios = document.getElementById("bloco-funcionarios");
const listaFuncionarios = document.getElementById("lista-funcionarios");
const btnEnviar = document.getElementById("btn-enviar");
const msgEl = document.getElementById("msg");
const form = document.getElementById("form-voto");
const sucessoEl = document.getElementById("sucesso");

function mostrarErro(texto) {
  msgEl.textContent = texto;
  msgEl.hidden = false;
  msgEl.className = "msg erro";
}

function limparErro() {
  msgEl.hidden = true;
}

function resetAPartirDe(nivel) {
  if (nivel <= 1) {
    blocoLider.hidden = true;
    liderSel.innerHTML = '<option value="" disabled selected>Selecione seu nome</option>';
  }
  if (nivel <= 2) {
    blocoFuncionarios.hidden = true;
    listaFuncionarios.innerHTML = "";
  }
  btnEnviar.disabled = true;
}

setorSel.addEventListener("change", async () => {
  limparErro();
  resetAPartirDe(1);
  const setorId = setorSel.value;
  if (!setorId) return;

  const resp = await fetch(`/api/lideres?setor_id=${setorId}`);
  const data = await resp.json();
  for (const l of data.lideres) {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.nome;
    liderSel.appendChild(opt);
  }
  blocoLider.hidden = false;
});

liderSel.addEventListener("change", async () => {
  limparErro();
  resetAPartirDe(2);
  const liderId = liderSel.value;
  if (!liderId) return;

  const resp = await fetch(`/api/funcionarios?lider_id=${liderId}`);
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
  if (!liderSel.value || !funcionarioInput) return;

  btnEnviar.disabled = true;
  const resp = await fetch("/api/votos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lider_id: Number(liderSel.value),
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
