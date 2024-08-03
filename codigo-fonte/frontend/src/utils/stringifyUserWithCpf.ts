import { People } from 'types/models';
import { maskCpf } from './maskCpf';

export const stringifyUserWithCpf = (user : Partial<People>): string => {
    let info = `${user.name}`;
    if (user.cpf) info += ` (${maskCpf(user.cpf)})`;
    return info;
};