import { container } from "@core/container";
import { InvalidCep } from "@errors/invalidErrors/invalidCep";
import { injectable } from "inversify";
import fetch from "node-fetch";

export interface CepInfo {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
}

@injectable()
export class CepService {

    async queryCep(cep: string) {
        if (!/[0-9]{8}/.test(cep)) throw new InvalidCep();

        const apiFetch = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const apiJson = await apiFetch.json();

        if (apiJson['erro']) throw new InvalidCep();
        return apiJson as CepInfo;
    }

    async validateCepCityAndUF(cep: string, city: string, uf: string) {
        if(cep == '' || cep == null) return;
        const info = await this.queryCep(cep.replace(/[^0-9]/, ''));
        return info.localidade == city && info.uf == uf;
    }


}

container.bind(CepService).toSelf();