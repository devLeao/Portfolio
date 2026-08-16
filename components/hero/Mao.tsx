"use client";

import { RoundedBox } from "@react-three/drei";

/**
 * Uma mão pousada no teclado.
 *
 * A versão anterior era uma esfera na ponta do braço — daí a impressão de
 * "mão torta e sem dedo". O que faz uma mão parecer mão em estilo Memoji não
 * é detalhe anatômico, são três coisas: a palma ser CHATA (não esférica), os
 * dedos serem visíveis mesmo que grossos, e o pulso ter a inclinação de quem
 * está apoiado, não de quem está pendurado.
 *
 * Quatro dedos e um polegar, todos cápsulas. Anatomia real aqui seria pior:
 * dedo fino em escala de brinquedo vira gravetinho e chama mais atenção para
 * o erro do que a simplificação.
 */
export default function Mao({
  lado,
  pele,
}: {
  /** -1 = esquerda, 1 = direita. Espelha o polegar para o lado de dentro. */
  lado: -1 | 1;
  pele: string;
}) {
  return (
    <group rotation={[0.35, 0, lado * -0.12]}>
      {/* palma achatada */}
      <RoundedBox args={[0.115, 0.055, 0.13]} radius={0.026} smoothness={4}>
        <meshStandardMaterial color={pele} roughness={0.78} />
      </RoundedBox>

      {/* quatro dedos, com um leve escalonamento de comprimento */}
      {[-0.039, -0.013, 0.013, 0.039].map((x, i) => (
        <mesh
          key={x}
          position={[x, -0.004, 0.088 + (i === 1 || i === 2 ? 0.012 : 0)]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <capsuleGeometry args={[0.0125, 0.036 + (i === 1 || i === 2 ? 0.01 : 0), 3, 6]} />
          <meshStandardMaterial color={pele} roughness={0.78} />
        </mesh>
      ))}

      {/* polegar, para dentro e um pouco mais alto */}
      <mesh
        position={[lado * -0.062, 0.004, 0.035]}
        rotation={[Math.PI / 2.4, 0, lado * 0.7]}
      >
        <capsuleGeometry args={[0.014, 0.03, 3, 6]} />
        <meshStandardMaterial color={pele} roughness={0.78} />
      </mesh>
    </group>
  );
}
