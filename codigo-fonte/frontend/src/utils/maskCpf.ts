export const maskCpf = (cpf : string): string => {
    let newCpf = '';
    if (cpf.length == 11) {
        newCpf += cpf.substring(0, 3) + '.';
        newCpf += cpf.substring(3, 6) + '.';
        newCpf += cpf.substring(6, 9) + '-';
        newCpf += cpf.substring(9, 11);
        return newCpf;
    } else {
        return cpf;
    }
};