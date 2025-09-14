Option Explicit

Dim fso, WshShell, envFile, line, parts
Dim ScriptFolder, NodeCommand

ScriptFolder = Left(WScript.ScriptFullName, Len(WScript.ScriptFullName) - Len(WScript.ScriptName))

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

Set envFile = fso.OpenTextFile(ScriptFolder & "\.env", 1)

Do Until envFile.AtEndOfStream
    line = Trim(envFile.ReadLine)
    If line <> "" And Left(line, 1) <> "#" Then
        parts = Split(line, "=")
        If UBound(parts) >= 1 Then
            WshShell.Environment("Process")(parts(0)) = parts(1)
        End If
    End If
Loop

envFile.Close

MsgBox "The system will now start and run on port 3000." & vbCrLf & _
       "Please do not close the console window that opens.", vbInformation, "Starting System"


NodeCommand = "cmd /k cd /d """ & ScriptFolder & """ && node .\.output\server\index.mjs"

WshShell.Run NodeCommand, 1, False


Set WshShell = Nothing
Set fso = Nothing