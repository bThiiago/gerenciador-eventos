import React from 'react';
import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import {
    ContentWrapper,
    DeveloperContainer,
    BackLink,
    Title,
    DeveloperName,
    DeveloperRole,
    GithubLink,
} from './styled';

const TeamPage: React.FC = () => {
    const developerList = [
        {
            name: 'Gustavo Patara',
            role: 'Desenvolvedor',
            github: 'https://github.com/SupNL',
            avatar: 'https://github.com/SupNL.png',
        },
        {
            name: 'Pedro Alonso',
            role: 'Desenvolvedor',
            github: 'https://github.com/phaalonso',
            avatar: 'https://github.com/phaalonso.png',
        },
        {
            name: 'Vitor Firmino',
            role: 'Desenvolvedor',
            github: 'https://github.com/VitorFirmino-dS',
            avatar: 'https://github.com/VitorFirmino-dS.png',
        },
        {
            name: 'Igor Antonio',
            role: 'Manutentor',
            github: 'https://github.com/IgorSiqueira2001',
            avatar: 'https://github.com/IgorSiqueira2001.png',
        },
        {
            name: 'Igor Matheus',
            role: 'Manutentor',
            github: 'https://github.com/IgorMTeixeira',
            avatar: 'https://github.com/IgorMTeixeira.png',
        },
        {
            name: 'João Pedro França',
            role: 'Manutentor',
            github: 'https://github.com/zFranca1',
            avatar: 'https://github.com/zFranca1.png',
        },
        {
            name: 'Thiago Bruchmann',
            role: 'Manutentor',
            github: 'https://github.com/bThiiago',
            avatar: 'https://github.com/bThiiago.png',
        },
        {
            name: 'Giovana Pereira Dassie Rocha',
            role: 'Manutentor',
            github: 'https://github.com/gihdassie',
            avatar: 'https://github.com/gihdassie.png',
        },
        {
            name: 'Letícia Soares Machado',
            role: 'Manutentor',
            github: 'https://github.com/leticiasmachado',
            avatar: 'https://github.com/leticiasmachado.png',
        },
    ];
    const teachersList = [
        {
            name: 'Andrea Padovan Jubileu',
            role: 'Líder do Projeto de Ensino',
            github: 'https://github.com/andreapjubileu',
            avatar: 'https://github.com/andreapjubileu.png',
        },
        {
            name: 'Kleber Manrique Trevisani',
            role: 'Orientador',
            github: 'https://github.com/klebertrevisani',
            avatar: 'https://github.com/klebertrevisani.png',
        },
    ];

    return (
        <>
            <Navbar activeItemUrl="/developers" />
            <Title>Desenvolvedores e Manutentores</Title>
            <ContentWrapper>
                {developerList.map((developer, index) => (
                    <DeveloperContainer key={index}>
                        {developer.avatar ? (
                            <img
                                src={developer.avatar}
                                alt={developer.name}
                                onClick={() => window.open(developer.github)}
                                width="100"
                                height="100"
                                style={{
                                    borderRadius: '50%',
                                    border: '1px solid #000',
                                    marginRight: '20px',
                                    cursor: 'pointer',
                                }}
                            />
                        ) : (
                            <img
                                src="
                                https://avatars.githubusercontent.com/u/7?v=4"
                                alt={developer.name}
                                width="100"
                                height="100"
                                style={{
                                    borderRadius: '50%',
                                    border: '1px solid #000',
                                    marginRight: '20px',
                                    cursor: 'pointer',
                                }}
                            />
                        )}
                        <div>
                            <DeveloperName>{developer.name}</DeveloperName>
                            <DeveloperRole>{developer.role}</DeveloperRole>
                            <GithubLink
                                href={developer.github}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Perfil do Github
                            </GithubLink>
                        </div>
                    </DeveloperContainer>
                ))}
            </ContentWrapper>
            <Title>Professores e Orientadores</Title>
            <ContentWrapper>
                {teachersList.map((teacher, index) => (
                    <DeveloperContainer key={index}>
                        {teacher.avatar ? (
                            <img
                                src={teacher.avatar}
                                alt={teacher.name}
                                onClick={() => window.open(teacher.github)}
                                width="100"
                                height="100"
                                style={{
                                    borderRadius: '50%',
                                    border: '1px solid #000',
                                    marginRight: '20px',
                                    cursor: 'pointer',
                                }}
                            />
                        ) : (
                            <img
                                src="
                                https://avatars.githubusercontent.com/u/7?v=4"
                                alt={teacher.name}
                                width="100"
                                height="100"
                                style={{
                                    borderRadius: '50%',
                                    border: '1px solid #000',
                                    marginRight: '20px',
                                }}
                            />
                        )}
                        <div>
                            <DeveloperName>{teacher.name}</DeveloperName>
                            <DeveloperRole>{teacher.role}</DeveloperRole>
                        </div>
                    </DeveloperContainer>
                ))}
            </ContentWrapper>

            <BackLink to="/home">Voltar para a página inicial</BackLink>

            <Footer />
        </>
    );
};

export default TeamPage;
