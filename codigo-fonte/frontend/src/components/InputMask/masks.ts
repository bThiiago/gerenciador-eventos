export function cep(e: React.FormEvent<HTMLInputElement>) : React.FormEvent<HTMLInputElement> {
    e.currentTarget.maxLength = 9;
    let value = e.currentTarget.value;
    value = value.replace(/\D/g,'');
    value = value.replace(/^(\d{5})(\d)/,'$1-$2');
    e.currentTarget.value = value;

    return e;
}


export function cpf(e: React.FormEvent<HTMLInputElement>) : React.FormEvent<HTMLInputElement> {
    e.currentTarget.maxLength = 14;
    let value = e.currentTarget.value;
    if (!value.match(/^(\d{3}).(\d{3}).(\d{3})-(\d{2})$/)) {
        value = value.replace(/\D/g,'');
        value = value.replace(/(\d{3})(\d)/,'$1.$2');
        value = value.replace(/(\d{3})(\d)/,'$1.$2');
        value = value.replace(/(\d{3})(\d{2})$/,'$1-$2');
        e.currentTarget.value = value;
    }
    return e;
}

export function phone(e: React.FormEvent<HTMLInputElement>) : React.FormEvent<HTMLInputElement> {
    e.currentTarget.maxLength = 15;
    let value = e.currentTarget.value;
    if (!value.match(/^((\d{2}))(\d{5})-(\d{4})$/)) {
        value = value.replace(/\D/g,'');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    
        e.currentTarget.value = value;
    }
    return e;
}

export function editionMask(e: React.FormEvent<HTMLInputElement>) : React.FormEvent<HTMLInputElement> {
    e.currentTarget.maxLength = 3;
    let value = e.currentTarget.value;
    if (!value.match(/^\d{3}$/)) {
        value = value.substring(0, 3);
        e.currentTarget.value = value;
    }
    return e;
}

export function cep_string(e: string) : string {
    if(e.length <= 9){
        let value = e;
        value = value.replace(/\D/g,'');
        value = value.replace(/^(\d{5})(\d)/,'$1-$2');
        e = value;
    }

    return e;
}


export function cpf_string(e: string) : string {
    if(e.length <= 14){
        let value = e;
        if (!value.match(/^(\d{3}).(\d{3}).(\d{3})-(\d{2})$/)) {
            value = value.replace(/\D/g,'');
            value = value.replace(/(\d{3})(\d)/,'$1.$2');
            value = value.replace(/(\d{3})(\d)/,'$1.$2');
            value = value.replace(/(\d{3})(\d{2})$/,'$1-$2');
            e = value;
        }
    }
    return e;
}

export function phone_string(e: string) : string {
    if(e.length <= 15){
        let value = e;
        if (!value.match(/^((\d{2}))(\d{5})-(\d{4})$/)) {
            value = value.replace(/\D/g,'');
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        
            e = value;
        }
    }
    return e;
}

export function editionMask_string(e: string) : string {
    if (e.length <= 3) {
        let value = e;
        if (!value.match(/^\d{3}$/)) {
            value = value.substring(0, 3);
            e = value;
        }
    }
    return e;
}