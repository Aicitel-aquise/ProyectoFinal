; ============================================================================
; SCRIPT DE INNO SETUP - SISTEMA SINDICATO DE MINIBUSES
; EXAMEN FINAL PRÁCTICO - INS-600 INGENIERÍA DE SOFTWARE
; ============================================================================

#define MyAppName "Sindicato de Minibuses"
#define MyAppVersion "1.0"
#define MyAppPublisher "Leticia Aquise Taco - INS 600"
#define MyAppExeName "SindicatoMinibuses.Api.exe"

[Setup]
AppId={{9F82A4C1-3A4B-4E7B-9A21-123456789ABC}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=.\Instalador_Output
OutputBaseFilename=Setup_SindicatoMinibuses
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Archivos publicados del Backend y Frontend en wwwroot
Source: ".\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: ".\index.html"; DestDir: "{app}\wwwroot"; Flags: ignoreversion
Source: ".\dashboard.html"; DestDir: "{app}\wwwroot"; Flags: ignoreversion
Source: ".\styles.css"; DestDir: "{app}\wwwroot"; Flags: ignoreversion
Source: ".\app.js"; DestDir: "{app}\wwwroot"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
