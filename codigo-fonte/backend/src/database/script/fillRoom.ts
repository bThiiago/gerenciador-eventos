import { Room } from '@models/Room';

const ListRoom = [
    //bloco A
    new Room('A101', 50, 'Biblioteca'),
    new Room('A102', 40, 'Laboratório de Prototipagem'),
    new Room('A129', 45, 'Laboratório de Máquinas Elétricas'),
    new Room('A103', 40, 'Laboratório de Mecânica'),
    new Room('A104', 80, 'Laboratório de Controle e Automação'),
    new Room('A105', 50, 'Laboratório de Eletrônica'),
    new Room('A106', 40, 'Laboratório de Informática'),
    new Room('A107', 20, 'Laboratório de Eficiência Energética'),
    new Room('A201', 50, 'Sala de Aula'),
    new Room('A202', 30, 'Sala de Aula'),
    new Room('A213', 40, 'Sala de Aula'),
    new Room('A203', 20, 'Laboratório de Sistemas Microcontroladores'),
    new Room('A204', 30, 'Centro de Línguas'),
    new Room('A205', 40, 'Laboratório de Informática'),
    new Room('A208', 40, 'Sala de Desenho'),
    new Room('A209', 24, 'Laboratório de Informática'),
    new Room('A210', 20, 'Laboratório de Informática'),
    //bloco B
    new Room('B101', 40, 'Laboratório de Ciências da Natureza'),
    new Room('B102', 30, 'Brinquedoteca'),
    new Room('B103', 30, 'Laboratório de Inovação'),
    new Room('B104', 30, 'Laboratório de Física'),
    new Room('B105', 40, 'Laboratório de Edificações'),
    new Room('B106', 80, 'Auditório'),
    new Room('B107', 30, 'Sala de Aula'),
    new Room('B108', 30, 'Sala de Aula'),
    new Room('B109', 30, 'Sala de Aula'),
    new Room('B110', 30, 'Sala de Aula'),
    //bloco C
    new Room('C104', 200, 'Ginásio Poliesportivo'),
    //bloco D
    new Room('D101', 30, 'Sala de Aula'),
    new Room('D104', 30, 'Sala de Aula'),
    new Room('D105', 30, 'Sala de Aula'),
    new Room('D106', 30, 'Sala de Aula'),
    //ambientes fora do campus
    new Room('EXT1', 300, 'Anfiteatro João Brilhante'),
];

export default ListRoom;