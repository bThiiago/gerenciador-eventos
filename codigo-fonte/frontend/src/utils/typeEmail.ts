export const typeEmail = (email : string): string => {
    const domain = email.substring(email.lastIndexOf('@')+1);
    if (domain.localeCompare('ifsp.edu.br') == 0) {
        return 'Servidor';
    } else{
        return 'Aluno';
    }
};