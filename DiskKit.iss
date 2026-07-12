; Disk Kit - Inno Setup Installer Script
; Build with:
;   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" DiskKit.iss

#define AppName "Disk Kit"
#define AppVersion "0.8.0"
#define AppPublisher "3rdVoyager"
#define AppExeName "DiskKit.exe"

[Setup]
AppId={{6C0CFB46-16AF-4F74-80FF-352108C91E65}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL=https://github.com/3rdVoyager/disk-kit
AppSupportURL=https://github.com/3rdVoyager/disk-kit/issues
AppUpdatesURL=https://github.com/3rdVoyager/disk-kit/releases
DefaultDirName={localappdata}\Programs\Disk Kit
DefaultGroupName=Disk Kit
DisableProgramGroupPage=yes
OutputDir=installer
OutputBaseFilename=DiskKit-Setup-{#AppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=assets\icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName=Disk Kit
MinVersion=6.1sp1
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64
ArchitecturesAllowed=x64
ChangesAssociations=no
DirExistsWarning=no

[Types]
Name: "full"; Description: "Full installation"

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "dist\DiskKit.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Disk Kit"; Filename: "{app}\{#AppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#AppExeName}"
Name: "{group}\Uninstall Disk Kit"; Filename: "{uninstallexe}"; IconFilename: "{app}\{#AppExeName}"
Name: "{autodesktop}\Disk Kit"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon; WorkingDir: "{app}"; IconFilename: "{app}\{#AppExeName}"

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch Disk Kit"; Flags: nowait postinstall skipifsilent