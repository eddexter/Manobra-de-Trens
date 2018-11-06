# Manobra-de-Trens
UEZO. Estrutura de Dados. Trabalho AV2.

Considere que um trem de carga tem N vagões. Cada um para ser deixado em uma estação diferente. Eles são numerados de 1 a N e o trem visita essas estações de N a 1. Obviamente, os vagões são rotulados por seu destino. Para facilitar a remoção dos carros eles devem ser reaorganizados em ordem crescente de seu número (1 a N). Quando os vagões estão nessa ordem eles podem ser apartados em cada estação.

Os vagões são rearranjados em um pátio de manobra que tem via de entrada, via de saída e K trilhos de espera entre as vias de entrada e saída.

Para reorganizar os vagões, o arranjo que chega na via de entrada é examinado da frente pra trás, vagão a vagão. Se o vagão que está sendo examinado é o próximo do arranjo de saída, ele é movído diretamente para a via de saída. Se não, ele é movido para um trilho de espera e é deixado lá até que seja hora de colocá-lo na via de saída. Os trilhos de espera operam em uma maneira LIFO, visto que os vagões entram e saem desses trilhos apenas por um lado. Ao rearranjar os vagões, somente os seguintes movimentos são permitidos:

- um vagão pode ser movido da frente do arranjo da via de entrada para um dos trilhos de espera ou para trás do arranjo na via de saída;
- um carro pode ser movido dp trilho de espera para o final do arranjo na via de saída.

Desenvolva em C um simulador do processo de rearranjo de vagões, para qualquer N e qualquer K, que servirá para analisar a eficiência do processo para diferentes tamanhos de trem em diferentes pátios de manobra. Para isso o simulador deverá:

- perguntar ao usuário a sequência de vagões na entrada, o número inicial de trilhos de espera e o número máximo de vagões permitidos nesses trilhos.
- realizar a simulação expondo o conteúdo dos trilhos de espera, vias de entrada e saída a cada passo;
- se o número de trilhos de espera se tornar insuficiente para o rearranjo, o simulador deve acrescentar outros conforme necessário;
- ao final do processo, mostrar o número de trilhos de espera utilizados e o número de etapas.
