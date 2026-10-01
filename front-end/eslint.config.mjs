import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // As telas buscam dados da API ao montar (padrão `useEffect(() => { carregar() })`,
      // em que `carregar` liga o indicador de carregamento). A regra do React Compiler
      // aponta isso como possível renderização extra; mantemos o aviso visível (warn)
      // em vez de desligá-lo, pois não é um erro de funcionamento.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "coverage/**"],
  },
];

export default config;
