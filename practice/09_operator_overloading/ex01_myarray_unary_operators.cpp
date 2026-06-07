// Как работать с задачей:
// 1. Откройте сайт курса в браузере.
// 2. Найдите эту задачу на сайте.
// 3. Напишите код ниже вместо TODO.
// 4. Запустите этот файл локально в Visual Studio или другим C++17 компилятором.

// Упражнение. MyArray и унарные операторы
// Тема: unary operator overloading.
//
// Что нужно сделать:
// 1. Создать class MyArray.
// 2. Добавить поля int* data и int size.
// 3. Написать конструктор по умолчанию.
// 4. Написать конструктор от размера.
// 5. Написать destructor.
// 6. Сделать deep copy: copy constructor и operator=.
// 7. Перегрузить operator[] для доступа к элементу.
// 8. Перегрузить operator++: добавить один элемент в конец.
// 9. Перегрузить operator--: удалить последний элемент, если массив не пуст.
// 10. Перегрузить operator-: вернуть копию с противоположными числами.
// 11. Перегрузить operator int(): вернуть размер массива.
//
// Важно:
// - raw pointer здесь используется как учебный пример управления памятью;
// - если есть new[], должен быть delete[];
// - operator[] для изменения элемента должен возвращать int&;
// - operator- не должен менять исходный массив.
//
// Напишите решение ниже.
// Не смотрите в solutions до самостоятельной попытки.

#include <iostream>

using namespace std;

class MyArray {
private:
    int* data;
    int size;

public:
    MyArray();
    explicit MyArray(int size);
    MyArray(const MyArray& other);
    MyArray& operator=(const MyArray& other);
    ~MyArray();

    int& operator[](int index);
    const int& operator[](int index) const;

    MyArray& operator++();
    MyArray& operator--();
    MyArray operator-() const;
    explicit operator int() const;
};

int main() {
    MyArray arr(2);

    // TODO: заполните элементы через arr[index]
    // TODO: покажите ++arr, --arr, -arr и int(arr)

    return 0;
}
