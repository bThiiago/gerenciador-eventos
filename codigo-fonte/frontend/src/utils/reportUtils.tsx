import React from 'react';
import { maskCpf } from 'utils/maskCpf';
import { typeEmail } from 'utils/typeEmail';
import * as XLSX from 'xlsx';
import {
    renderDateWithTime,
} from 'utils/dateUtils';
import generatePdf from 'utils/generatePdf';
import { ActivityRegistry, ActivityType } from 'types/models';
import convertToStaticHtml from 'utils/convertToStaticHtml';
import getActivityTitle from 'utils/getActitvityTitle';
import getActivityCode from 'utils/getActivityCode';
import { anonymizeCpf } from './anonymizeCpf';

const downloadFile = (
    content: string[][],
    fileName: string,
    extension: 'xlsx' | 'xls'
): void => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(content);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, {
        bookType: extension,
        type: 'array',
    });
    const blob = new Blob([excelBuffer], {
        type: extension === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
            : 'application/vnd.ms-excel;charset=UTF-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
};

export const downloadRegistryXls = (
    activity: ActivityType,
    registryList: ActivityRegistry[],
    extension: 'xlsx' | 'xls'
): void => {
    const entries = registryList
        .filter((registry) => !registry.presences.find((p) => !p.isPresent))
        .map((registry) => [
            maskCpf(registry.user.cpf as string) || '', // Verificação para substituir undefined por ''
            registry.user.name || '',
            'Brasileira',
            registry.user.email || '',
            typeEmail(registry.user.email as string) || '', // Verificação para substituir undefined por ''
        ]);

    const fileName = `presencas_${getActivityCode(activity)}_${getActivityTitle(
        activity
    )}`;

    downloadFile(entries, fileName, extension);
};

export const downloadMinistrantsXls = (activity: ActivityType, extension: 'xlsx' | 'xls' = 'xlsx'): void => {
    console.log(activity);
    console.log(activity.teachingUsers);
    const entries = activity.teachingUsers?.map((teachingUser) => [
        maskCpf(teachingUser.cpf ? maskCpf(teachingUser.cpf) : ''),
        teachingUser.name || '',
        'Brasileira', 
        teachingUser.email || '', 
        typeEmail(teachingUser.email as string) || '', 
        
    ]);
    
    if (!entries || entries.length === 0) {
        return;
    }

    const fileName = `ministrantes_${getActivityCode(activity)}_${getActivityTitle(activity)}`;

    downloadFile(entries, fileName, extension);
};

export const downloadRegistryPdf = (
    activity: ActivityType,
    registryList: ActivityRegistry[]
): void => {
    if (!activity || !registryList) {
        return;
    }

    const element = (
        <div>
            <div
                style={{
                    fontSize: '32px',
                    marginBottom: '15px',
                    textAlign: 'center',
                }}
            >
                Registro de presenças
            </div>
            <div
                style={{
                    fontSize: '20px',
                }}
            >
                <b>Evento:</b> {activity.event.edition}{' '}
                {activity.event.eventCategory?.category}
            </div>
            <div
                style={{
                    fontSize: '15px',
                    marginBottom: '10px',
                }}
            >
                <b>Atividade:</b> {getActivityCode(activity)} - {activity.title}
            </div>
            <div
                style={{
                    marginBottom: '24px',
                }}
            >
                <b style={{ fontSize: '15px' }}>Locais da atividade:</b>
                <br />
                {activity.schedules.map((sc) => {
                    return (
                        <div key={sc.id}>
                            <div
                                style={{ fontSize: '15px', marginLeft: '18px' }}
                            >
                                {sc.room.code} -{' '}
                                {renderDateWithTime(
                                    sc.startDate,
                                    sc.durationInMinutes
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <table
                style={{
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    width: '100%',
                }}
            >
                <tr
                    style={{
                        textAlign: 'left',
                    }}
                >
                    <th>Presenças</th>
                    <th>Participante</th>
                </tr>
                {registryList.map((registry) => {
                    return (
                        <tr
                            key={registry.id}
                            style={{
                                paddingLeft: '8px',
                                paddingRight: '8px',
                                borderBottom: 'dotted 1px grey',
                                paddingBottom: '3px',
                            }}
                        >
                            <td>
                                {activity.schedules.map((sc) => {
                                    return (
                                        <input
                                            key={sc.id}
                                            type="checkbox"
                                            defaultChecked={
                                                registry.readyForCertificate &&
                                                !registry.presences.find(
                                                    (p) => !p.isPresent
                                                )
                                            }
                                            readOnly
                                            style={{
                                                marginLeft: '8px',
                                                marginTop: '20px',
                                            }}
                                        />
                                    );
                                })}
                            </td>
                            <td
                                style={{
                                    paddingLeft: '8px',
                                    paddingRight: '8px',
                                    paddingBottom: '3px',
                                }}
                            >
                                {registry.user.name} (
                                {registry.user.cpf &&
                                    maskCpf(registry.user.cpf)}
                                )
                            </td>
                            <td></td>
                        </tr>
                    );
                })}
            </table>
        </div>
    );
    generatePdf(
        `relatorio_presencas_${getActivityCode(activity)}_${getActivityTitle(
            activity
        )}`,
        convertToStaticHtml(element)
    );
};



export const downloadPresenceListPdf = (
    activity: ActivityType,
    registryList: ActivityRegistry[]
): void => {
    if (!activity || !registryList) {
        return;
    }

    const element = (
        <div>
            <div
                style={{
                    fontSize: '32px',
                    marginBottom: '15px',
                    textAlign: 'center',
                }}
            >
                Lista de presenças
            </div>
            <div
                style={{
                    fontSize: '15px',
                }}
            >
                <b>Evento:</b> {activity.event.edition}{' '}
                {activity.event.eventCategory?.category}
            </div>
            <div
                style={{
                    fontSize: '15px',
                    marginBottom: '10px',
                }}
            >
                <b>Atividade:</b> {getActivityCode(activity)} - {activity.title}
            </div>
            <div
                style={{
                    marginBottom: '20px',
                }}
            >
                <b style={{ fontSize: '15px' }}>Locais da atividade:</b>
                <br />
                {activity.schedules.map((sc) => {
                    return (
                        <div key={sc.id}>
                            <div style={{ fontSize: '18px' }}>
                                {sc.room.code} -{' '}
                                {renderDateWithTime(
                                    sc.startDate,
                                    sc.durationInMinutes
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <table
                style={{
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '15px',
                    width: '100%',
                }}
                cellSpacing="0"
                cellPadding="0"
            >
                <tr
                    style={{
                        textAlign: 'left',
                    }}
                >
                    <th>Participantes</th>
                    <th>Assinaturas</th>
                </tr>
                {registryList.map((registry, index) => {
                    const participantNumber = index + 1;
                    return (
                        <tr
                            key={registry.id}
                            style={{
                                borderBottom: 'solid 1px grey',
                                paddingBottom: '5px',
                            }}
                        >
                            <td
                                style={{
                                    paddingBottom: '5px',
                                    paddingTop: '10px',
                                }}
                            >
                                {participantNumber}. {registry.user.name} (
                                {registry.user.cpf &&
                                    anonymizeCpf(registry.user.cpf)}
                                )
                            </td>
                        </tr>
                    );
                })}
            </table>
        </div>
    );
    generatePdf(
        `lista_presencas_${getActivityCode(activity)}_${getActivityTitle(
            activity
        )}`,
        convertToStaticHtml(element)
    );
};