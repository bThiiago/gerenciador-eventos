export const anonymizeCpf = (cpf : string): string => {
    let newCpf = '';
    if (cpf.length == 11) {
        newCpf += cpf.substring(0, 3) + '.';
        newCpf += '***.***-';
        newCpf += cpf.substring(9, 11);
        console.log(newCpf);
        return newCpf;
    } else {
        return cpf;
    }
};