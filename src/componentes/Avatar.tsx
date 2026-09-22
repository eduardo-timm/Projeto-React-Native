import { StyleSheet, Text, View } from 'react-native';

import type { Usuario } from '../sessao';

export const CORES_USUARIO: Record<Usuario, string> = {
  Eduardo: '#5B5BF7',
  Tomás: '#10B9A5',
  Tiago: '#F59E0B',
  Teste: '#94A3B8',
};

/** Círculo colorido com a inicial da pessoa. */
export function Avatar({ nome, tamanho = 40 }: { nome: Usuario; tamanho?: number }) {
  return (
    <View
      style={[
        estilos.circulo,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: CORES_USUARIO[nome],
        },
      ]}>
      <Text style={[estilos.inicial, { fontSize: tamanho * 0.42 }]}>{nome.charAt(0)}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  inicial: { color: '#fff', fontWeight: '800' },
});
