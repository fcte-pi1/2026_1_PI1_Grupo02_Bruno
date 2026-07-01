import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import getCorridas, {getCorridaTrajeto, getLabirintos} from "../services/corridaService.js";

function formatarData(valor) {
    if (!valor) return "Nao informado";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(valor));
}

function formatarNumero(valor, unidade = "") {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
        return "Nao informado";
    }

    return `${Number(valor).toFixed(2).replace(".", ",")}${unidade}`;
}

export default function Historico() {
    const navigate = useNavigate();
    const [corridas, setCorridas] = useState([]);
    const [labirintos, setLabirintos] = useState([]);
    const [corridaSelecionada, setCorridaSelecionada] = useState(null);
    const [trajeto, setTrajeto] = useState([]);
    const [carregandoTrajeto, setCarregandoTrajeto] = useState(false);
    const [erroTrajeto, setErroTrajeto] = useState("");

    useEffect(() => {
        getLabirintos()
            .then((response) => setLabirintos(response.data))
            .catch((error) =>
                console.error("Erro ao buscar labirintos:", error)
            );
    }, []);

    useEffect(() => {
        getCorridas()
            .then((response) => setCorridas(response.data))
            .catch((error) =>
                console.error("Erro ao buscar corridas:", error)
            );
    }, []);

    const labirintosPorId = useMemo(() => {
        return labirintos.reduce((mapa, labirinto) => {
            mapa[labirinto.id] = labirinto;
            return mapa;
        }, {});
    }, [labirintos]);

    const abrirModal = (corrida) => {
        setCorridaSelecionada(corrida);
        setTrajeto([]);
        setErroTrajeto("");
        setCarregandoTrajeto(true);

        getCorridaTrajeto(corrida.id)
            .then((response) => setTrajeto(response.data))
            .catch((error) => {
                console.error("Erro ao buscar trajeto:", error);
                setErroTrajeto("Nao foi possivel carregar o trajeto desta corrida.");
            })
            .finally(() => setCarregandoTrajeto(false));
    };

    const fecharModal = () => {
        setCorridaSelecionada(null);
        setTrajeto([]);
        setErroTrajeto("");
    };

    const labirintoSelecionado = corridaSelecionada
        ? labirintosPorId[corridaSelecionada.labirinto_id]
        : null;

    return (
        <div className="w-full min-h-dvh bg-[#0f1117] text-white px-6 md:px-8 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center border-b border-[#2c3142] pb-5 mb-8">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#00d9ff] mb-2">
                        MicroMouse
                    </p>
                    <h1 className="text-3xl font-semibold tracking-wide">
                        Historico de Corridas
                    </h1>
                </div>

                <div className="bg-[#1b2030] border border-[#272d40] rounded-full px-5 py-2 text-sm text-gray-300 w-fit">
                    {corridas.length} corrida{corridas.length === 1 ? "" : "s"}
                </div>
            </div>

            {corridas.length === 0 ? (
                <div className="flex justify-center items-center h-80 bg-[#1a1d2e] border border-[#272d40] rounded-xl">
                    <span className="text-gray-400 text-lg">
                        Nenhuma corrida encontrada.
                    </span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {corridas.map((corrida) => {
                        const labirinto = labirintosPorId[corrida.labirinto_id];

                        return (
                            <div
                                key={corrida.id}
                                className="bg-[#1b2030] border border-[#272d40] rounded-xl overflow-hidden shadow-md hover:border-cyan-500 hover:shadow-cyan-500/20 transition-all duration-300"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-[#272d40]">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-400">
                                            Corrida
                                        </p>

                                        <h2 className="text-3xl font-semibold">
                                            #{corrida.id}
                                        </h2>
                                    </div>

                                    <div className="bg-[#343a52] text-gray-200 px-4 py-1 rounded-full text-sm">
                                        {labirinto
                                            ? `${labirinto.tamanho} x ${labirinto.tamanho}`
                                            : "..."}
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    <div className="bg-[#111523] rounded-xl p-4">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                            Estado
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`h-3 w-3 rounded-full ${
                                                    corrida.desafio_concluido
                                                        ? "bg-green-500"
                                                        : "bg-red-500"
                                                }`}
                                            />

                                            <span
                                                className={`font-medium ${
                                                    corrida.desafio_concluido
                                                        ? "text-green-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {corrida.desafio_concluido
                                                    ? "Finalizou"
                                                    : "Nao concluido"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-[#111523] rounded-xl p-4">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                            Cronometro
                                        </p>

                                        <h3 className="text-4xl font-light text-[#00d9ff]">
                                            {formatarNumero(corrida.tempo_conclusao_sec, "s")}
                                        </h3>
                                    </div>

                                    <div className="bg-[#111523] rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-gray-400">
                                                Resultado
                                            </p>

                                            <p className="mt-1 text-gray-200">
                                                Desafio
                                            </p>
                                        </div>

                                        <span
                                            className={`font-semibold ${
                                                corrida.desafio_concluido
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {corrida.desafio_concluido
                                                ? "Cumprido"
                                                : "Falhou"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => abrirModal(corrida)}
                                        className="w-full bg-[#00d9ff] hover:bg-[#5ae8ff] text-[#071018] transition-all duration-300 px-5 py-3 rounded-xl text-sm font-semibold"
                                    >
                                        Ver detalhes
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-center mt-12">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="bg-[#3a4057] hover:bg-[#4b5473] transition-all duration-300 px-16 py-3 rounded-xl text-lg font-medium"
                >
                    Voltar
                </button>
            </div>

            {corridaSelecionada && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-corrida-titulo"
                    onClick={fecharModal}
                >
                    <div
                        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1b2030] border border-[#272d40] rounded-xl shadow-2xl shadow-cyan-500/10"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[#1b2030] border-b border-[#272d40] p-5 flex justify-between items-start gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] mb-2">
                                    Detalhes da corrida
                                </p>
                                <h2 id="modal-corrida-titulo" className="text-2xl font-semibold">
                                    Corrida #{corridaSelecionada.id}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                className="bg-[#343a52] hover:bg-[#4b5473] text-gray-100 rounded-lg h-10 w-10 text-xl leading-none"
                                aria-label="Fechar modal"
                            >
                                x
                            </button>
                        </div>

                        <div className="p-5 md:p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Labirinto
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {labirintoSelecionado?.nome ?? "Nao informado"}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {labirintoSelecionado
                                            ? `${labirintoSelecionado.tamanho} x ${labirintoSelecionado.tamanho}`
                                            : "Tamanho indisponivel"}
                                    </p>
                                </div>

                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Tempo
                                    </p>
                                    <p className="text-lg font-semibold text-[#00d9ff]">
                                        {formatarNumero(corridaSelecionada.tempo_conclusao_sec, "s")}
                                    </p>
                                </div>

                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Velocidade media
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatarNumero(corridaSelecionada.velocidade_media)}
                                    </p>
                                </div>

                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Consumo bateria
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatarNumero(corridaSelecionada.consumo_bateria, "%")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Inicio
                                    </p>
                                    <p className="text-gray-200">
                                        {formatarData(corridaSelecionada.iniciado_em)}
                                    </p>
                                </div>

                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Fim
                                    </p>
                                    <p className="text-gray-200">
                                        {formatarData(corridaSelecionada.finalizado_em)}
                                    </p>
                                </div>

                                <div className="bg-[#111523] rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                                        Status
                                    </p>
                                    <p
                                        className={`font-semibold ${
                                            corridaSelecionada.desafio_concluido
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {corridaSelecionada.desafio_concluido
                                            ? "Desafio cumprido"
                                            : "Desafio falhou"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#111523] rounded-xl p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-400">
                                            Trajeto registrado
                                        </p>
                                        <h3 className="text-xl font-semibold">
                                            {trajeto.length} ponto{trajeto.length === 1 ? "" : "s"}
                                        </h3>
                                    </div>
                                </div>

                                {carregandoTrajeto ? (
                                    <p className="text-gray-400 py-6 text-center">
                                        Carregando trajeto...
                                    </p>
                                ) : erroTrajeto ? (
                                    <p className="text-red-400 py-6 text-center">
                                        {erroTrajeto}
                                    </p>
                                ) : trajeto.length === 0 ? (
                                    <p className="text-gray-400 py-6 text-center">
                                        Nenhum ponto de telemetria registrado para esta corrida.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px] text-sm">
                                            <thead className="text-gray-400 border-b border-[#272d40]">
                                            <tr>
                                                <th className="text-left font-medium py-3 pr-4">Ordem</th>
                                                <th className="text-left font-medium py-3 pr-4">Celula</th>
                                                <th className="text-left font-medium py-3 pr-4">Direcao</th>
                                                <th className="text-left font-medium py-3 pr-4">Velocidade</th>
                                                <th className="text-left font-medium py-3 pr-4">Bateria</th>
                                                <th className="text-left font-medium py-3">Registro</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#272d40]">
                                            {trajeto.map((ponto) => (
                                                <tr key={`${ponto.posicao_ordem}-${ponto.registrado_em}`}>
                                                    <td className="py-3 pr-4 text-[#00d9ff]">
                                                        #{ponto.posicao_ordem}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-200">
                                                        L{ponto.celula?.linha ?? "-"} / C{ponto.celula?.coluna ?? "-"}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-200">
                                                        {ponto.direcao ?? "-"}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-200">
                                                        {formatarNumero(ponto.velocidade)}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-200">
                                                        {formatarNumero(ponto.bateria, "%")}
                                                    </td>
                                                    <td className="py-3 text-gray-400">
                                                        {formatarData(ponto.registrado_em)}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
