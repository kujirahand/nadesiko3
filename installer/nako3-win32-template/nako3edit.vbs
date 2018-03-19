rem ----------------------------
rem nako3edit execute script
rem ----------------------------

Set fso = createObject("Scripting.FileSystemObject")
Set shell = WScript.CreateObject("WScript.Shell")
Set env = shell.Environment("Process")

dim home
dim path
dim cmd

home = fso.getParentFolderName(WScript.ScriptFullName)
path = _
  home & "\bin;" & _
  home & "\nodejs;" & _
  shell.ExpandEnvironmentStrings("%PATH%")

env.Item("NAKO_HOME") = home
env.Item("PATH") = path

node = """" & home & "\nodejs\node" & """"
cnako = """" & home & "\src\cnako3.js" & """"
nako3edit = """" & home & "\tools\nako3edit\index.nako3" & """"

cmd = node & " " & cnako & " " & nako3edit
shell.Run(cmd)

rem cmd2 = cmd1 & " " & home & "\tools\nako3edit\run.js"
rem WScript.Echo(shell.ExpandEnvironmentStrings("%PATH%"))
